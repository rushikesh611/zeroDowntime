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
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse shadow-none border">
            <CardHeader className="pb-4">
              <div className="h-10 w-10 bg-muted rounded mb-4"></div>
              <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-4 bg-muted rounded w-full mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardContent>
            <CardFooter className="pt-4 border-t bg-muted/5">
              <div className="h-9 bg-muted rounded w-full"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (statusPages.length === 0) {
    return (
      <div className="text-center p-20 border border-dashed rounded-3xl bg-muted/5">
        <Radio className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" />
        <h3 className="text-base font-bold">No status pages yet</h3>
        <p className="text-xs text-muted-foreground mb-6 max-w-[250px] mx-auto leading-relaxed">
          Create a public page to communicate service status and uptime history to your users.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {statusPages.map((page) => (
        <Card key={page.id} className="shadow-none border group hover:border-primary/30 transition-all overflow-hidden flex flex-col bg-card/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="size-9 rounded bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                <Radio className="size-4" />
              </div>
              <Badge variant="secondary" className="text-[9px] uppercase font-black tracking-widest px-2 h-5 bg-emerald-500/10 text-emerald-600 border-transparent">
                {page.monitors.length} {page.monitors.length === 1 ? 'Monitor' : 'Monitors'}
              </Badge>
            </div>
            <CardTitle className="text-lg font-bold">{page.title}</CardTitle>
            <CardDescription className="text-[10px] font-bold font-mono truncate bg-muted/50 p-1.5 rounded mt-2 uppercase tracking-widest text-muted-foreground">
              {page.subdomain}.{domain}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-4 flex-1">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest opacity-60">
                <span className="text-muted-foreground flex items-center gap-1.5"><Activity className="size-3" /> Status</span>
                <span className={page.monitors.every(m => m.status === 'RUNNING') ? 'text-emerald-500' : 'text-amber-500'}>
                    {page.monitors.every(m => m.status === 'RUNNING') ? 'Operational' : 'Partial Issues'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest opacity-60">
                <span className="text-muted-foreground">Created</span>
                <span className="text-muted-foreground/80">{formatDateDifference(page.createdAt)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-4 border-t bg-muted/20 flex gap-2">
            <Button size="sm" variant="ghost" className="h-9 text-[10px] font-black uppercase tracking-widest flex-1 bg-background hover:bg-primary/5 hover:text-primary transition-all" asChild>
              <a href={`/statuspage/${page.id}`}>
                Manage
              </a>
            </Button>
            <Button size="sm" variant="ghost" className="h-9 text-[10px] font-black uppercase tracking-widest flex-1 bg-background hover:bg-primary/5 hover:text-primary transition-all" asChild>
              <a
                href={`/s/${page.subdomain}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-3 mr-1.5" />
                View
              </a>
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-rose-500 hover:text-white hover:bg-rose-500 bg-background transition-all">
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
          </CardFooter>
        </Card>
      ))}
    </div>

  )
}

export default StatusPageList