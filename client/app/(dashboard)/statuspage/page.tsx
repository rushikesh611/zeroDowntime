'use client';

import { useEffect, useState } from 'react';
import { ContentLayout } from '@/components/dashboard/content-layout';
import StatusPageList from '@/components/statuspage/statuspagelist';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Monitor } from '@/types';
import { Plus, TowerControl, Radio } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

const StatusPage = () => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoadingMonitors, setIsLoadingMonitors] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, checkAuth } = useAppStore();

  const domain = process.env.NEXT_PUBLIC_CLIENT_URL
    ? new URL(process.env.NEXT_PUBLIC_CLIENT_URL).host
    : 'beacn.online';

  const fetchMonitors = async (signal?: AbortSignal) => {
    try {
      const monRes = await fetch('/api/monitors?status=RUNNING', { signal });
      if (monRes.ok) {
        if (monRes.status === 204) {
          setMonitors([]);
        } else {
          const data = await monRes.json();
          setMonitors(data);
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching monitors:', error);
      }
    } finally {
      setIsLoadingMonitors(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    fetchMonitors(abortController.signal);
    if (!user) {
      checkAuth();
    }
    return () => abortController.abort();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMonitor || !subdomain || !title) {
        toast({
            variant: "destructive",
            title: "Missing fields",
            description: "Please fill in all required fields."
        });
        return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/status-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monitorId: selectedMonitor,
          subdomain: subdomain.toLowerCase().trim(),
          title,
          description,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create status page');

      toast({
        title: 'Success',
        description: 'Status page created successfully',
      });
      setDialogOpen(false);
      
      // Clear form
      setSelectedMonitor('');
      setSubdomain('');
      setTitle('');
      setDescription('');

      // Trigger refresh via the list's listener
      const element = document.getElementById('status-page-list');
      if (element) {
        element.dispatchEvent(new CustomEvent('refresh'));
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFree = user?.plan === 'FREE';
  const hasReachedLimit = isFree && monitors.some((m: any) => m.statusPageIds && m.statusPageIds.length > 0);

  return (
    <ContentLayout>
      <div className="space-y-8 max-w-5xl mx-auto py-6 animate-in fade-in-50 duration-500">
        <div className="flex justify-between items-center px-1">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Status Pages</h1>
            <p className="text-sm text-muted-foreground font-medium opacity-70">
              Communicate your service reliability and incident updates.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={isLoadingMonitors || hasReachedLimit} className="font-bold shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Page
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle>Create Status Page</DialogTitle>
                  <DialogDescription className="text-xs">
                    {isFree 
                      ? 'Free tier allows 1 status page. Upgrade for more.' 
                      : 'Create a new public status page for your services.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-5 py-6">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Initial Monitor</Label>
                    <Select onValueChange={setSelectedMonitor} value={selectedMonitor}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select a monitor" />
                      </SelectTrigger>
                      <SelectContent>
                        {monitors.map((monitor) => (
                          <SelectItem key={monitor.id} value={monitor.id}>
                            {monitor.name || monitor.url}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Acme API Status"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="subdomain" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Subdomain</Label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        id="subdomain"
                        placeholder="acme"
                        className="flex-1 h-9 text-sm"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                      />
                      <span className="text-xs font-bold text-muted-foreground opacity-60">.{domain}</span>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="Status for our main infrastructure"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="w-full font-bold">
                    {isSubmitting ? 'Creating...' : 'Create Status Page'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div id="status-page-list">
            <StatusPageList />
        </div>
      </div>
    </ContentLayout>
  );
};

export default StatusPage;