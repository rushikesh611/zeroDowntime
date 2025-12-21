"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertCircle, Activity } from "lucide-react";
import { formatDistance, format } from "date-fns";

interface MonitorLog {
  id: string;
  monitorId: string;
  isUp: boolean;
  statusCode: number;
  responseTime: number;
  region: string;
  lastCheckedAt: string;
}

interface StatusPage {
  id: string;
  title: string;
  description?: string;
  monitor: {
    url: string;
    status: string;
  };
}

interface StatusPageData {
  statusPage: StatusPage;
  logs: MonitorLog[];
}

export default function StatusPage() {
  const params = useParams();
  const { subdomain } = params;
  const [data, setData] = useState<StatusPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStatusPage = async () => {
      try {
        const response = await fetch(`/api/status-pages/public/${subdomain}`);
        if (!response.ok) {
          throw new Error("Status page not found");
        }
        const data = await response.json();
        setData(data);
      } catch (error) {
        console.error("Error fetching status page:", error);
        setError("Status page not found or no longer available");
      } finally {
        setLoading(false);
      }
    };

    if (subdomain) {
      fetchStatusPage();
    }
  }, [subdomain]);

  const calculateUptimePercentage = (logs: MonitorLog[]): string => {
    if (!logs || logs.length === 0) return "N/A";

    const upCount = logs.filter(log => log.isUp).length;
    const percentage = (upCount / logs.length) * 100;
    return percentage.toFixed(2) + "%";
  };

  const getMostRecentStatus = (logs: MonitorLog[]): boolean => {
    if (!logs || logs.length === 0) return true;

    const mostRecent = logs.sort((a, b) =>
      new Date(b.lastCheckedAt).getTime() - new Date(a.lastCheckedAt).getTime()
    )[0];

    return mostRecent.isUp;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl space-y-4">
          <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
          <div className="h-64 bg-muted rounded animate-pulse mt-8"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Status Page Not Found</h1>
          <p className="text-muted-foreground">
            The status page you're looking for doesn't exist or is no longer available.
          </p>
        </div>
      </div>
    );
  }

  const { statusPage, logs } = data;
  const isCurrentlyUp = getMostRecentStatus(logs);
  const uptimePercentage = calculateUptimePercentage(logs);
  const lastCheckedAt = logs.length > 0 ? new Date(logs[logs.length - 1].lastCheckedAt) : null;

  return (
    <div className="flex min-h-screen flex-col items-center p-4 bg-muted/20">
      <header className="w-full max-w-3xl flex items-center justify-center mb-10 pt-8">
        <div className="flex items-center">
          <Activity className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Beacn</h1>
        </div>
      </header>

      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">{statusPage.title}</h1>
          {statusPage.description && (
            <p className="mt-2 text-muted-foreground">{statusPage.description}</p>
          )}
          <div className="mt-4">
            <Badge variant={isCurrentlyUp ? "outline" : "destructive"} className="text-sm py-1 px-4">
              {isCurrentlyUp ? "All Systems Operational" : "System Issues Detected"}
            </Badge>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle>Current Status</CardTitle>
            <CardDescription>
              Monitoring: {statusPage.monitor.url}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              {isCurrentlyUp ? (
                <CheckCircle className="h-10 w-10 text-green-500 mr-4" />
              ) : (
                <XCircle className="h-10 w-10 text-destructive mr-4" />
              )}
              <div>
                <p className="text-xl font-semibold">
                  {isCurrentlyUp ? "All systems operational" : "System experiencing issues"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Uptime over last 24 hours: {uptimePercentage}
                </p>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Last checked: {lastCheckedAt ? formatDistance(lastCheckedAt, new Date(), { addSuffix: true }) : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.filter(log => !log.isUp).length > 0 ? (
              <div className="space-y-4">
                {logs.filter(log => !log.isUp).slice(0, 5).map(log => (
                  <div key={log.id} className="border-l-4 border-destructive pl-4 py-2">
                    <div className="flex justify-between">
                      <p className="font-medium">Outage Detected</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(log.lastCheckedAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <p className="text-sm mt-1">
                      Region: {log.region} • Status Code: {log.statusCode}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-muted-foreground">No incidents in the last 24 hours</p>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground border-t pt-4">
            Showing data from the last 24 hours
          </CardFooter>
        </Card>

        <footer className="mt-12 text-center text-xs text-muted-foreground pb-8">
          <p>Powered by Beacn • {format(new Date(), 'MMMM d, yyyy')}</p>
        </footer>
      </div>
    </div>
  );
}