from fastapi import FastAPI, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from elasticsearch import Elasticsearch
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import logging
from dotenv import load_dotenv
import os

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

es = Elasticsearch(
    os.getenv('ELASTICSEARCH_URL'), api_key=os.getenv('ELASTICSEARCH_API_KEY')
)

# Elasticsearch index settings for logs
INDEX_MAPPING = {
    "mappings": {
        "properties": {
            "timestamp": {"type": "date"},
            "source": {"type": "keyword"},
            "level": {"type": "keyword"},
            "message": {"type": "text"},
            "metadata": {"type": "object", "enabled": True}
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
    init_elasticsearch()

@app.post("/logs", status_code=status.HTTP_201_CREATED)
async def ingest_logs(logs: LogBatch):
    actions = []
    now = datetime.utcnow().isoformat()

    for log in logs.logs:
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
    q: str = Query("*", description="Free text search query"),
    limit: int = Query(100, description="Maximum number of results to return")
):
    """Simple free-text search for logs"""
    # Build simple Elasticsearch query
    es_query = {
        "query": {
            "query_string": {
                "query": q,
                "default_field": "message"
            }
        },
        "sort": [{"timestamp": "desc"}],
        "size": limit
    }
    
    # Execute search
    result = es.search(index="logs", body=es_query)
    
    # Format response
    hits = result["hits"]["hits"]
    total = result["hits"]["total"]["value"] if "total" in result["hits"] else len(hits)
    
    logs = [{"id": hit["_id"], **hit["_source"]} for hit in hits]
    
    return {
        "total": total,
        "logs": logs,
        "query": q
    }

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

@app.get("/health")
async def health_check():
    """Ultra simple health check for serverless mode - just checks connectivity"""
    try:
        # Just try to get information about a specific index or create a test document
        is_alive = False
        error_message = None
        
        try:
            # Try a simple info request - this should work in serverless
            info = es.info()
            is_alive = True
        except Exception as e:
            error_message = str(e)
            
            # If info fails, try an extremely simple operation
            try:
                # Test connectivity by trying to create a test document
                test_response = es.index(
                    index="logs-test", 
                    document={
                        "timestamp": datetime.utcnow().isoformat(),
                        "message": "Health check test",
                        "level": "INFO",
                        "source": "health-check"
                    },
                    refresh=True
                )
                is_alive = True
                error_message = None
            except Exception as e2:
                error_message = f"Connection test failed: {str(e2)}"
        
        if is_alive:
            return {
                "status": "healthy",
                "elasticsearch": "connected",
                "app": "running"
            }
        else:
            return {
                "status": "unhealthy",
                "elasticsearch": "not connected",
                "error": error_message,
                "app": "running"
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "app": "running"
        }