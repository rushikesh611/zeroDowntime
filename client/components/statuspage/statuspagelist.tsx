"use client";

import { toast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ExternalLink, Trash2, Radio, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDateDifference } from "@/lib/utils"

interface StatusPage {
    id: string;
    title: string;
    subdomain: string;
    createdAt: string;
    monitors: {
        url: string;
        status: string;
    }[];
}

const StatusPageList = () => {
  const [statusPages, setStatusPages] = useState<StatusPage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const domain = process.env.NEXT_PUBLIC_CLIENT_URL ? new URL(process.env.NEXT_PUBLIC_CLIENT_URL).host : 'beacn.online';

  const fetchStatusPages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/status-pages");
      if (response.status === 204) {
        setStatusPages([]);
        return;
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
  }, []);

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
      <div className="grid gap-6 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse border border-border bg-card rounded-lg overflow-hidden flex flex-col h-[200px]">
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-8 w-8 bg-muted rounded"></div>
                  <div className="h-5 w-20 bg-muted rounded-md"></div>
                </div>
                <div className="h-5 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
              <div className="h-4 bg-muted rounded w-full mt-4"></div>
            </div>
            <div className="p-4 border-t bg-muted/10 h-16 flex gap-2">
              <div className="h-8 bg-muted rounded flex-grow"></div>
              <div className="h-8 bg-muted rounded flex-grow"></div>
              <div className="h-8 w-8 bg-muted rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (statusPages.length === 0) {
    return (
      <div className="text-center p-20 border border-dashed rounded-lg bg-card max-w-lg mx-auto">
        <Radio className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" />
        <h3 className="text-base font-bold text-foreground">No status pages yet</h3>
        <p className="text-xs text-muted-foreground mb-6 max-w-[320px] mx-auto leading-relaxed">
          Create a public status page to communicate service status, performance metrics, and real-time incident reports to your customers.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {statusPages.map((page) => (
        <div key={page.id} className="border border-border bg-card rounded-lg overflow-hidden flex flex-col hover:border-border/80 transition-colors">
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="size-8 rounded bg-muted flex items-center justify-center text-muted-foreground border">
                  <Radio className="size-4" />
                </div>
                <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider px-2 h-5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-md">
                  {page.monitors.length} {page.monitors.length === 1 ? 'Monitor' : 'Monitors'}
                </Badge>
              </div>
              <h3 className="text-md font-semibold text-foreground">{page.title}</h3>
              <p className="text-[10px] font-mono truncate bg-muted/40 px-2 py-1 rounded border border-border/40 mt-3 text-muted-foreground select-all w-fit">
                {page.subdomain}.{domain}
              </p>
            </div>
            
            <div className="space-y-2 mt-4 pt-4 border-t border-border/40">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-muted-foreground flex items-center gap-1.5"><Activity className="size-3" /> Status</span>
                <span className={page.monitors.every(m => m.status === 'RUNNING') ? 'text-emerald-600' : 'text-amber-600'}>
                    {page.monitors.every(m => m.status === 'RUNNING') ? 'Operational' : 'Partial Issues'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-muted-foreground">Created</span>
                <span className="text-muted-foreground/80">{formatDateDifference(page.createdAt)}</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-border/80 bg-muted/20 flex gap-2">
            <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase tracking-wider flex-grow bg-background hover:bg-muted/40 transition-colors" asChild>
              <a href={`/statuspage/${page.id}`}>
                Manage
              </a>
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase tracking-wider flex-grow bg-background hover:bg-muted/40 transition-colors" asChild>
              <a
                href={`/s/${page.subdomain}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3 mr-1.5" />
                View Page
              </a>
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-rose-500 hover:text-white hover:bg-rose-500 hover:border-rose-600 transition-all">
                  <Trash2 className="size-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Status Page</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure? This will immediately disable the public status page and remove all associated incident history.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(page.id)}
                    className="bg-rose-500 text-white hover:bg-rose-600"
                  >
                    Delete Page
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatusPageList;