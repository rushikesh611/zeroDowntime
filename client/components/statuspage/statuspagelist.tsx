"use client";

import { toast } from "@/hooks/use-toast"
import { StatusPage } from "@/types"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Copy, ExternalLink, Trash2, Radio } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDateDifference } from "@/lib/utils"

const StatusPageList = () => {
  const [statusPages, setStatusPages] = useState<StatusPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const domain = process.env.NODE_ENV === 'production' ? 'zerodowntime.live' : 'localhost:3000';

  const fetchStatusPages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/status-pages");
      if (!response.ok) {
        throw new Error("Failed to fetch status pages");
      }
      const data = await response.json();
      setStatusPages(data);
    } catch (error) {
      console.error("Error fetching status pages:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load status pages",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusPages();

    // Listen for refresh event
    const handleRefresh = () => {
      fetchStatusPages();
    };

    const element = document.getElementById('status-page-list');
    if (element) {
      element.addEventListener('refresh', handleRefresh);
      return () => {
        element.removeEventListener('refresh', handleRefresh);
      };
    }
  }, []);

  const copyToClipboard = (subdomain: string) => {
    navigator.clipboard.writeText(`https://${subdomain}.${domain}`);
    toast({
      title: "Copied!",
      description: "URL copied to clipboard",
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/status-pages/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete status page");
      }

      toast({
        title: "Status page deleted",
        description: "The status page has been successfully deleted",
      });

      fetchStatusPages();
    } catch (error) {
      console.error("Error deleting status page:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete status page",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-full mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardContent>
            <CardFooter>
              <div className="h-9 bg-muted rounded w-24"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (statusPages.length === 0) {
    return (
      <div className="text-center p-12 border rounded-lg">
        <Radio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No status pages yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first status page to display uptime for your services
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {statusPages.map((page) => (
        <Card key={page.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{page.title}</CardTitle>
              <Badge variant={page.monitor.status === "RUNNING" ? "outline" : "destructive"}>
                {page.monitor.status === "RUNNING" ? "Active" : "Monitor Paused"}
              </Badge>
            </div>
            <CardDescription>
              <span className="font-mono">{page.subdomain}.{domain}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm mb-1">
              <span className="font-medium">Monitoring:</span> {page.monitor.url}
            </div>
            {page.description && (
              <p className="text-muted-foreground text-sm mt-2">{page.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Created {formatDateDifference(page.createdAt)}
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(page.subdomain)}>
                <Copy className="h-4 w-4 mr-1" />
                Copy URL
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a
                  href={`/status-preview/${page.subdomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View
                </a>
              </Button>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-destructive border-destructive">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Status Page</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this status page? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(page.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

export default StatusPageList