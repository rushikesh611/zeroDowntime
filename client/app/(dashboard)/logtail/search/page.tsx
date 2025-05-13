"use client";

import { ContentLayout } from "@/components/dashboard/content-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle, Search } from "lucide-react";
import { useEffect, useState } from "react";

interface LogSource {
  id: string;
  name: string;
  apiKey: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  source: string;
  metadata: Record<string, any>;
}

interface SearchParams {
  query: string;
  source: string;
  page: number;
  pageSize: number;
}

const levelColors = {
  info: "bg-blue-500",
  warn: "bg-amber-500",
  error: "bg-red-500",
  debug: "bg-green-500"
};

const Logtail = () => {
  // Add a new state for the actual search parameters
  const [inputParams, setInputParams] = useState<SearchParams>({
    query: "",
    source: "",
    page: 1,
    pageSize: 20
  });

  // This is what we'll use for the API calls
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: "",
    source: "",
    page: 1,
    pageSize: 20
  });

  // Rest of the states remain the same
  const [sources, setSources] = useState<LogSource[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLogs, setTotalLogs] = useState(0);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [selectedSource, setSelectedSource] = useState<LogSource | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // Fetch log sources on component mount
  useEffect(() => {
    const fetchSources = async () => {
      try {
        const response = await fetch('/api/log');
        if (response.ok) {
          const data = await response.json();
          setSources(data);

          // Set default source and perform initial search
          if (data.length > 0) {
            setSelectedSource(null); // Default to all sources
            setInputParams({
              ...inputParams,
              source: "" // Empty for all sources
            });
            setSearchParams({
              ...searchParams,
              source: "" // Empty for all sources
            });
          }
        }
      } catch (error) {
        console.error('Error fetching log sources:', error);
      }
    };

    fetchSources();
  }, []);

  // Only fetch logs when searchParams changes
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);

      try {
        const { query, source, page, pageSize } = searchParams;
        const params = new URLSearchParams();

        if (query) params.append('q', query);

        // Important: Make sure we're passing the source name, not ID
        // This should match what the backend expects
        if (source && source !== "All") {
          const selectedSourceObj = sources.find(s => s.id === source);
          if (selectedSourceObj) {
            params.append('source', selectedSourceObj.name);
          }
        }

        params.append('page', page.toString());
        params.append('limit', pageSize.toString());

        // Choose API key based on selected source or default to the first one
        const apiKey = selectedSource?.apiKey || sources[0]?.apiKey;

        if (!apiKey) {
          console.error("No API key available");
          setLoading(false);
          return;
        }

        // Use proper Next.js rewrite or direct URL with correct host
        const response = await fetch(`/logvault/search?${params}`, {
          headers: {
            'X-API-Key': apiKey
          }
        });

        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
          setTotalLogs(data.total || 0);
        } else {
          console.error("Error response:", await response.text());
        }
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (sources.length > 0) {
      fetchLogs();
    }
  }, [searchParams, selectedSource, sources]);

  const handleSearch = () => {
    // Copy current input params to search params, which triggers the API call
    setSearchParams({
      ...inputParams,
      page: 1
    });
  };

  // Updated source handling
  const handleSourceChange = (sourceId: string) => {
    // For "All", set source to empty string
    if (sourceId === "All") {
      setSelectedSource(null);
      setInputParams({
        ...inputParams,
        source: ""
      });
      return;
    }

    // For specific source, find the source object to get its API key
    const source = sources.find(s => s.id === sourceId);

    if (source) {
      setSelectedSource(source);
      setInputParams({
        ...inputParams,
        source: sourceId
      });
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only update input params, not search params
    setInputParams({
      ...inputParams,
      query: e.target.value
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const totalPages = Math.ceil(totalLogs / searchParams.pageSize);

  // Handle pagination separately
  const handlePageChange = (page: number) => {
    setSearchParams({
      ...searchParams,
      page
    });
  };

  return (
    <ContentLayout title="Search Logs">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-xl mb-2">Search Logs</h1>
          <p className="text-sm">Filter and search through your application logs</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowHelp(!showHelp)}>
          <HelpCircle className="h-4 w-4 mr-2" />
          Search Help
        </Button>
      </div>

      {showHelp && (
        <div className="mb-4 p-4 bg-muted rounded-md">
          <h3 className="text-sm font-medium mb-2">Advanced Search Syntax</h3>
          <ul className="text-xs space-y-1 list-disc pl-4">
            <li><strong>Simple terms:</strong> error, timeout, 500</li>
            <li><strong>Field search:</strong> userId:123, level:error</li>
            <li><strong>AND operator:</strong> error AND timeout</li>
            <li><strong>OR operator:</strong> error OR warning</li>
            <li><strong>NOT operator:</strong> error NOT timeout</li>
            <li><strong>Combinations:</strong> error AND (userId:123 OR userId:456) NOT timeout</li>
          </ul>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/6">
            <Select
              value={inputParams.source || "All"}
              onValueChange={handleSourceChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Sources</SelectItem>
                {sources.map(source => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full">
            <Input
              placeholder="Search logs... (e.g., error AND userId:123 NOT timeout)"
              value={inputParams.query}
              onChange={handleQueryChange}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use operators: AND, OR, NOT (e.g., error AND userId:123 NOT timeout)
            </p>
          </div>
          <div className="w-full md:w-1/6">
            <Button className="w-full" onClick={handleSearch}>
              <Search className='mr-2 w-5 h-5' /> Search
            </Button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-2 text-sm text-muted-foreground">
        {!loading && totalLogs > 0 && (
          <span>
            Showing {(searchParams.page - 1) * searchParams.pageSize + 1} to {Math.min(searchParams.page * searchParams.pageSize, totalLogs)} of {totalLogs} logs
          </span>
        )}
      </div>

      {/* Logs List - Splunk Style */}
      <div className="space-y-2 mb-4">
        {loading ? (
          // Loading skeletons
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="border rounded-md p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-5 w-full" />
            </div>
          ))
        ) : logs.length > 0 ? (
          logs.map((log) => (
            <div
              key={log.id}
              className="border rounded-md p-3 bg-white dark:bg-slate-950 hover:bg-muted/30 transition-colors overflow-hidden"
            >
              {/* Top row with timestamp, level, source - MADE MORE RESPONSIVE */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs sm:text-sm font-mono text-muted-foreground">
                  {formatDate(log.timestamp)}
                </span>
                <Badge className={levelColors[log.level as keyof typeof levelColors] || "bg-gray-500"}>
                  {log.level}
                </Badge>
                <span className="text-xs sm:text-sm">
                  <span className="font-mono inline-block align-middle">source={log.source}</span>
                </span>
              </div>

              {/* Message in monospace - IMPROVED FOR MOBILE */}
              <div className="font-mono text-xs sm:text-sm whitespace-pre-wrap break-all mb-2 max-w-full overflow-x-auto">
                {log.message}
              </div>

              {/* Metadata fields in simple Splunk style - FIXED WRAPPING ISSUES */}
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 text-xs overflow-x-auto">
                  <div className="flex flex-wrap gap-y-1 gap-x-3">
                    {Object.entries(log.metadata).map(([key, value]) => (
                      <span key={key} className="font-mono whitespace-nowrap">
                        <span className="font-medium text-slate-600 dark:text-slate-400">{key}=</span>
                        <span className="break-all">
                          {typeof value === 'object'
                            ? JSON.stringify(value)
                            : String(value)}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center p-8 border rounded-md">
            <p className="text-muted-foreground">No logs found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center py-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => {
                    if (searchParams.page > 1) {
                      handlePageChange(searchParams.page - 1);
                    }
                  }}
                  className={searchParams.page <= 1 ? "pointer-events-none opacity-50" : ""}
                />

              </PaginationItem>

              {/* Generate pagination links */}
              {Array.from(
                { length: Math.min(5, totalPages) },
                (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (searchParams.page <= 3) {
                    pageNum = i + 1;
                  } else if (searchParams.page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = searchParams.page - 2 + i;
                  }

                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={pageNum === searchParams.page}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
              )}

              {totalPages > 5 && searchParams.page < totalPages - 2 && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => {
                    if (searchParams.page < totalPages) {
                      handlePageChange(searchParams.page + 1);
                    }
                  }}
                  className={searchParams.page >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </ContentLayout>
  );
}

export default Logtail;