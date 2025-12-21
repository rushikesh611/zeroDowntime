"use client";

import { ContentLayout } from "@/components/dashboard/content-layout";
import StatusPageList from "@/components/statuspage/statuspagelist";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Monitor } from "@/types";
import { Copy, ExternalLink, Plus } from "lucide-react";
import { useEffect, useState } from "react";

const StatusPage = () => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdStatusPage, setCreatedStatusPage] = useState<{ id: string, subdomain: string } | null>(null);

  const domain = process.env.NEXT_PUBLIC_CLIENT_URL
    ? new URL(process.env.NEXT_PUBLIC_CLIENT_URL).host
    : 'localhost:3000';

  const fetchMonitors = async () => {
    try {
      const response = await fetch("/api/monitors");
      if (!response.ok) {
        throw new Error("Failed to fetch monitors");
      }
      const data = await response.json();
      setMonitors(data.filter((monitor: Monitor) => monitor.status === "RUNNING"));
    } catch (error) {
      console.error("Error fetching monitors:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load monitors",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMonitor || !subdomain || !title) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill all required fields"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/status-pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          monitorId: selectedMonitor,
          subdomain: subdomain.toLowerCase().trim(),
          title,
          description
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create status page");
      }

      const data = await response.json();
      setCreatedStatusPage(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating status page",
        description: error.message,
      });
      setIsSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setCreatedStatusPage(null);
    setSelectedMonitor("");
    setSubdomain("");
    setTitle("");
    setDescription("");
    setIsSubmitting(false);

    // Refresh the list of status pages
    const statusPageList = document.getElementById('status-page-list');
    if (statusPageList) {
      const refreshEvent = new CustomEvent('refresh');
      statusPageList.dispatchEvent(refreshEvent);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "URL copied to clipboard",
    });
  };

  return (
    <ContentLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Status Pages</h1>
          <p className="text-muted-foreground">
            Create public status pages for your services
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={monitors.length === 0 || isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Create Status Page
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            {!createdStatusPage ? (
              <>
                <DialogHeader>
                  <DialogTitle>Create Status Page</DialogTitle>
                  <DialogDescription>
                    Create a public status page to share with your users
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="monitor" className="text-right">
                        Monitor
                      </Label>
                      <div className="col-span-3">
                        <Select
                          value={selectedMonitor}
                          onValueChange={setSelectedMonitor}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a monitor" />
                          </SelectTrigger>
                          <SelectContent>
                            {monitors.map((monitor) => (
                              <SelectItem key={monitor.id} value={monitor.id}>
                                {monitor.url}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="subdomain" className="text-right">
                        Subdomain
                      </Label>
                      <div className="col-span-3 flex items-center">
                        <Input
                          id="subdomain"
                          value={subdomain}
                          onChange={(e) => setSubdomain(e.target.value)}
                          placeholder="your-status-page"
                          className="rounded-r-none"
                        />
                        <span className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-xs text-muted-foreground">
                          .{domain}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="title" className="text-right">
                        Title
                      </Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="col-span-3"
                        placeholder="My Service Status"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Input
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="col-span-3"
                        placeholder="Status page for my service"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Status Page Created</DialogTitle>
                  <DialogDescription>
                    Your public status page is now available
                  </DialogDescription>
                </DialogHeader>
                <div className="py-6">
                  <div className="mb-4">
                    <Label className="text-sm font-medium mb-1 block">Status Page URL</Label>
                    <div className="flex items-center bg-muted rounded-md p-3 text-sm break-all relative">
                      <span className="pr-8">
                        https://{createdStatusPage.subdomain}.{domain}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => copyToClipboard(`https://${createdStatusPage.subdomain}.${domain}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-6">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/status-preview/${createdStatusPage.subdomain}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Preview
                      </a>
                    </Button>
                    <div className="text-sm text-muted-foreground">
                      Use this URL to share with your users
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleDialogClose}>Done</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div id="status-page-list">
        <StatusPageList />
      </div>
    </ContentLayout>
  );
}

export default StatusPage;