import math
from fastapi import FastAPI, HTTPException, status, Query, Header, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from elasticsearch import Elasticsearch
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import logging
from dotenv import load_dotenv
import os
from fastapi.security import APIKeyHeader
import httpx

load_dotenv()

app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_elasticsearch_config():
    """Get Elasticsearch configuration based on environment"""
    env = os.getenv('APP_ENV', 'development')
    
    if env == 'production':
        # Production configuration using ES cloud service
        return {
            'cloud_id': os.getenv('ELASTICSEARCH_CLOUD_ID'),
            'api_key': os.getenv('ELASTICSEARCH_API_KEY')
        }
    else:
        # Local development configuration
        return {
            'hosts': os.getenv('ELASTICSEARCH_URL', 'http://localhost:9200'),
            'basic_auth': (
                os.getenv('ELASTICSEARCH_USERNAME', ''),
                os.getenv('ELASTICSEARCH_PASSWORD', '')
            ) if os.getenv('ELASTICSEARCH_USERNAME') else None
        }

# Update the ES client initialization
es_config = get_elasticsearch_config()
es = Elasticsearch(**es_config)

API_KEY_HEADER = APIKeyHeader(name="X-API-Key")
AUTH_SERVICE_URL = os.getenv('AUTH_SERVICE_URL', 'http://localhost:3001/api/log')

# Elasticsearch index settings for logs
INDEX_MAPPING = {
    "mappings": {
        "dynamic": True,  # Automatically map new fields
        "properties": {
            "timestamp": {"type": "date"},  # Keep timestamp as date for sorting/filtering
            "source": {"type": "keyword"},  # Keep source as keyword for exact matching
            "level": {"type": "keyword"},   # Keep level as keyword for exact matching
            "message": {
                "type": "text",
                "fields": {
                    "keyword": {"type": "keyword"}  # Allow both full-text and exact matching
                }
            },
            "metadata": {
                "type": "object",
                "dynamic": True  # Allow any structure in metadata
            }
        }
    }
}

def init_elasticsearch():
    try:
        if not es.indices.exists(index="logs"):
            # For serverless: Just try to create the index with mappings but no custom settings
            es.indices.create(index="logs", body=INDEX_MAPPING)
            logger.info("Created 'logs' index in Elasticsearch")
    except Exception as e:
        # If that fails, try creating without any settings at all
        logger.warning(f"Error creating index with mappings: {e}")
        try:
            if not es.indices.exists(index="logs"):
                es.indices.create(index="logs")
                logger.info("Created 'logs' index in Elasticsearch without custom mappings")
                
                # Try to update mappings after creation
                try:
                    just_mappings = {"properties": INDEX_MAPPING["mappings"]["properties"]}
                    es.indices.put_mapping(index="logs", body=just_mappings)
                    logger.info("Updated 'logs' index mappings")
                except Exception as mapping_error:
                    logger.warning(f"Could not update mappings: {mapping_error}")
        except Exception as create_error:
            logger.error(f"Failed to create index: {create_error}")
            # Continue anyway - the index might be auto-created on first write


# Models
class LogEntry(BaseModel):
    timestamp: Optional[str] = None
    source: str
    level: str
    message: str
    metadata: Optional[Dict[str,Any]] = {}

class LogBatch(BaseModel):
    logs: List[LogEntry]

@app.on_event("startup")
async def startup_event():
    """Initialize Elasticsearch and HTTP client"""
    init_elasticsearch()
    app.state.client = httpx.AsyncClient()

@app.on_event("shutdown")
async def shutdown_event():
    """Close HTTP client"""
    await app.state.client.aclose()

@app.post("/logs")
async def ingest_logs(logs: LogBatch,
    request: Request,
    api_key: str = Header(None, alias="X-API-Key")):

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required"
        )

    # validate API key
    source = await validate_api_key(api_key, request)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    

    actions = []
    now = datetime.utcnow().isoformat()

    for log in logs.logs:
        # Honor the source provided by the client if present,
        # otherwise use the one from validation
        if not log.source or log.source == "default-client":
            log.source = source.get("name", "unknown")
        
        # Add additional metadata
        log.metadata["sourceId"] = source.get("id")
        log.metadata["userId"] = source.get("userId")

        if not log.timestamp:
            log.timestamp = now
        
        actions.append({"index":{"_index":"logs"}})
        actions.append(log.dict())
    
    if actions:
        result = es.bulk(body=actions,refresh=True)

        if result.get("errors"):
            errors = [item for item in result["items"] if "error" in item["index"]]
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to index {len(errors)} logs: {errors[:5]}..."
            )
        
        return {"message": f"Successfully indexed {len(logs.logs)} log entries"}
    
    return {"message": "No logs to index"}

@app.get("/search")
async def search_logs(
    request: Request,
    q: str = Query(None, description="Search query"),
    source: str = Query(None, description="Log source"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    api_key: str = Depends(API_KEY_HEADER)
):
    # Validate API key first
    user = await get_current_user(request, api_key)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
    
    # Build Elasticsearch query
    search_query = {
        "query": {
            "bool": {
                "must": [],
                "must_not": [],
                "should": []
            }
        },
        "sort": [{"timestamp": "desc"}],  # Recent logs first
        "from": (page - 1) * limit,
        "size": limit
    }
    
    # Add source filter if provided
    if source:
        search_query["query"]["bool"]["must"].append({"term": {"source": source}})
    
    # Process advanced search query if provided
    if q:
        # Parse query for advanced syntax - AND, OR, NOT
        try:
            # Handle NOT operator
            not_terms = []
            if " NOT " in q.upper():
                # Extract NOT clauses
                parts = q.split(" NOT ")
                q = parts[0]  # Keep the main query
                
                # Add NOT terms
                for not_part in parts[1:]:
                    # Handle if the NOT term is part of a larger expression
                    not_term = not_part.split(" AND ")[0].split(" OR ")[0].strip()
                    not_terms.append(not_term)
            
            # Handle AND/OR operators
            and_terms = []
            or_terms = []
            
            # If we still have AND/OR operators
            if " AND " in q.upper() or " OR " in q.upper():
                parts = re.split(r' (?:AND|OR) ', q, flags=re.IGNORECASE)
                
                # Extract the operators
                operators = re.findall(r' (AND|OR) ', " " + q + " ", flags=re.IGNORECASE)
                
                for i, part in enumerate(parts):
                    if i == 0:  # First term always goes into must
                        and_terms.append(part.strip())
                    elif i <= len(operators) and operators[i-1].upper() == "AND":
                        and_terms.append(part.strip())
                    else:
                        or_terms.append(part.strip())
            else:
                # Simple query with no operators
                and_terms.append(q.strip())
            
            # Add AND terms
            for term in and_terms:
                if term:
                    search_query["query"]["bool"]["must"].append({
                        "query_string": {"query": term}
                    })
            
            # Add OR terms
            for term in or_terms:
                if term:
                    search_query["query"]["bool"]["should"].append({
                        "query_string": {"query": term}
                    })
            
            # Add NOT terms
            for term in not_terms:
                if term:
                    search_query["query"]["bool"]["must_not"].append({
                        "query_string": {"query": term}
                    })
            
            # If we have OR terms, set minimum_should_match
            if or_terms:
                search_query["query"]["bool"]["minimum_should_match"] = 1
                
        except Exception as e:
            logger.error(f"Error parsing advanced query: {e}")
            # Fall back to simple query
            search_query["query"]["bool"]["must"].append({
                "query_string": {"query": q}
            })
    
    # Execute search
    try:
        result = es.search(
            index="logs",
            body=search_query,
            track_total_hits=True
        )
        
        # Process results
        logs = []
        for hit in result["hits"]["hits"]:
            log = hit["_source"]
            log["id"] = hit["_id"]
            logs.append(log)
        
        total = result["hits"]["total"]["value"]
        
        return {
            "logs": logs,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": math.ceil(total / limit)
        }
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")

@app.get("/sources")
async def get_sources():
    """Get list of available log sources"""
    agg_query = {
        "size": 0,
        "aggs": {
            "sources": {
                "terms": {"field": "source", "size": 100}
            }
        }
    }
    
    result = es.search(index="logs", body=agg_query)
    sources = [bucket["key"] for bucket in result["aggregations"]["sources"]["buckets"]]
    
    return {"sources": sources}

@app.get("/levels")
async def get_levels():
    """Get list of available log levels"""
    agg_query = {
        "size": 0,
        "aggs": {
            "levels": {
                "terms": {"field": "level", "size": 20}
            }
        }
    }
    
    result = es.search(index="logs", body=agg_query)
    levels = [bucket["key"] for bucket in result["aggregations"]["levels"]["buckets"]]
    
    return {"levels": levels}

async def validate_api_key(api_key: str, request: Request) -> Optional[dict]:
    """Validate API key by calling auth service"""
    try:
        response = await request.app.state.client.get(
            f"{AUTH_SERVICE_URL}/validate",
            headers={"X-API-Key": api_key}
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Ensure consistent field names
            return {
                "id": data.get("id"),
                "name": data.get("name"),  # This will be used as the source
                "userId": data.get("userId"),
                "source": data.get("name")  # For backward compatibility
            }
        return None
    except Exception as e:
        logger.error(f"Error validating API key: {e}")
        return None

async def get_current_user(
    request: Request,
    api_key: str = Depends(API_KEY_HEADER)
) -> str:
    """Get current user from API key"""
    source = await validate_api_key(api_key, request)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    return source["userId"]

@app.get("/validate")
async def validate_api_key_endpoint(
    request: Request,
    api_key: str = Depends(API_KEY_HEADER)
):
    source_info = await validate_api_key(api_key, request)
    
    if not source_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    return source_info


@app.get("/health")
async def health_check():
    """Health check that works with both local and cloud ES"""
    try:
        # Check ES connectivity with a simple ping
        is_alive = es.ping()
        
        if is_alive:
            return {
                "status": "healthy",
                "elasticsearch": "connected",
                "environment": os.getenv('APP_ENV', 'development'),
                "app": "running"
            }
        else:
            return {
                "status": "unhealthy",
                "elasticsearch": "not connected",
                "environment": os.getenv('APP_ENV', 'development'),
                "app": "running"
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "environment": os.getenv('APP_ENV', 'development'),
            "app": "running"
        }