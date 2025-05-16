"use client";

import { ContentLayout } from '@/components/dashboard/content-layout';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { formatDateDifference } from "@/lib/utils";
import {
  AlertCircle,
  Copy,
  KeyRound,
  Plus,
  Trash2
} from "lucide-react";
import { useEffect, useState } from 'react';

interface LogSource {
  id: string;
  name: string;
  apiKey: string;
  createdAt: string;
}

const LogSources = () => {
  const [sources, setSources] = useState<LogSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newSourceName, setNewSourceName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [createdSource, setCreatedSource] = useState<LogSource | null>(null);
  const [error, setError] = useState("");

  // Fetch log sources on component mount
  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/log');
      if (!response.ok) {
        throw new Error('Failed to fetch log sources');
      }
      const data = await response.json();
      setSources(data);
      setError("");
    } catch (err) {
      console.error('Error fetching sources:', err);
      setError("Failed to load sources. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSource = async () => {
    if (!newSourceName.trim()) {
      toast({
        title: "Error",
        description: "Source name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newSourceName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to create log source');
      }

      const createdSource = await response.json();
      setCreatedSource(createdSource);

      // Add to sources list
      setSources(prev => [...prev, createdSource]);

      // Reset the form
      setNewSourceName("");
      // Keep dialog open to show API key
    } catch (err) {
      console.error('Error creating source:', err);
      toast({
        title: "Error",
        description: "Failed to create log source. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    try {
      const response = await fetch(`/api/log/${sourceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete log source');
      }

      // Remove from sources list
      setSources(prev => prev.filter(source => source.id !== sourceId));

      toast({
        title: "Source deleted",
        description: "The log source has been successfully deleted.",
      });
    } catch (err) {
      console.error('Error deleting source:', err);
      toast({
        title: "Error",
        description: "Failed to delete log source. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard.",
    });
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCreatedSource(null);
  };

  return (
    <ContentLayout title='Log Sources'>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-xl mb-2">Log Sources</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create source
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            {!createdSource ? (
              <>
                <DialogHeader>
                  <DialogTitle>Create New Log Source</DialogTitle>
                  <DialogDescription>
                    Add a new log source to start collecting and analyzing logs.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newSourceName}
                      onChange={(e) => setNewSourceName(e.target.value)}
                      className="col-span-3"
                      placeholder="My Application"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button onClick={handleCreateSource}>Create</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Source Created Successfully</DialogTitle>
                  <DialogDescription>
                    Your new log source has been created. Use the API key below to send logs.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[300px] overflow-y-auto">
                  <div className="grid gap-2">
                    <Label>Source Name</Label>
                    <div className="p-2 bg-muted rounded">{createdSource.name}</div>
                  </div>
                  <div className="grid gap-2">
                    <Label>API Key</Label>
                    <div className="relative">
                      <div className="p-2 bg-muted rounded font-mono text-sm overflow-x-auto break-all">
                        {createdSource.apiKey}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => copyToClipboard(createdSource.apiKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Important!</AlertTitle>
                    <AlertDescription>
                      This API key will only be shown once. Please save it somewhere secure.
                    </AlertDescription>
                  </Alert>
                </div>
                <DialogFooter>
                  <Button onClick={closeDialog}>Done</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-6">
        {isLoading ? (
          // Loading skeletons
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded-lg border p-3 animate-pulse">
                <div className="w-2/6">
                  <div className="h-5 bg-muted rounded w-2/3"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mt-1"></div>
                </div>
                <div className="w-2/6 flex justify-center">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
                <div className="w-2/6 flex justify-end">
                  <div className="h-8 w-8 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sources.length > 0 ? (
          <ScrollArea className="h-screen">
            {sources.map((source) => (
              <div key={source.id} className="flex flex-col mb-3">
                <div className="flex items-center justify-between gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent">
                  <div className="flex items-center gap-2 flex-grow">
                    <div className="p-1.5 rounded-md bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{source.name}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        Created {formatDateDifference(source.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-destructive">
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Log Source</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{source.name}"? This action cannot be undone and
                            will invalidate any API keys for this source.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteSource(source.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center mt-20">
            <p className="text-lg font-medium text-center mb-4">You don&apos;t have any log sources yet.</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create your first source
            </Button>
          </div>
        )}
      </div>
    </ContentLayout>
  );
};

export default LogSources;