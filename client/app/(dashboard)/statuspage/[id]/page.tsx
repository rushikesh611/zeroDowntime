'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ContentLayout } from '@/components/dashboard/content-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
  Radio,
  ExternalLink,
  Settings,
  ShieldAlert,
  Plus,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  ChevronRight,
  Monitor as MonitorIcon,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';
import { useAppStore } from '@/store/useAppStore';

interface IncidentUpdate {
  id: string;
  message: string;
  status: string;
  createdAt: string;
}

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
  updates: IncidentUpdate[];
}

interface Monitor {
  id: string;
  name: string;
  url: string;
  status: string;
  userId: string;
}

interface StatusPage {
  id: string;
  title: string;
  description: string;
  subdomain: string;
  customDomain?: string;
  isPublic: boolean;
  monitors: Monitor[];
  monitorIds: string[];
  incidents: Incident[];
}

export default function StatusPageManage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<StatusPage | null>(null);
  const [allMonitors, setAllMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const { user, checkAuth } = useAppStore();

  // Edit form states
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCustomDomain, setEditCustomDomain] = useState('');
  const [selectedMonitors, setSelectedMonitors] = useState<string[]>([]);

  // New incident states
  const [incTitle, setIncTitle] = useState('');
  const [incSeverity, setIncSeverity] = useState('SEV3');
  const [incStatus, setIncStatus] = useState('INVESTIGATING');
  const [incMessage, setIncMessage] = useState('');
  const [isIncSubmitting, setIsIncSubmitting] = useState(false);
  const [incDialogOpen, setIncDialogOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [res, monRes] = await Promise.all([
        fetch(`/api/status-pages/manage/${id}`),
        fetch('/api/monitors')
      ]);

      if (!res.ok) throw new Error('Failed to load status page');
      const json = await res.json();
      setData(json);
      setEditTitle(json.title);
      setEditDesc(json.description || '');
      setEditCustomDomain(json.customDomain || '');
      setSelectedMonitors(json.monitorIds || []);

      if (monRes.ok) {
        const monitors = await monRes.json();
        // Only allow active monitors to be added, but keep existing selected ones in the list even if paused
        setAllMonitors(monitors);
      }

      if (!user) {
        checkAuth();
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleUpdateSettings = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/status-pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDesc,
          customDomain: editCustomDomain,
          monitorIds: selectedMonitors
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update');
      }
      toast({ title: 'Success', description: 'Settings updated' });
      fetchData();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incMessage) {
      toast({ variant: 'destructive', title: 'Error', description: 'Update message is required' });
      return;
    }
    setIsIncSubmitting(true);
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statusPageId: id,
          title: incTitle,
          severity: incSeverity,
          status: incStatus,
          message: incMessage
        })
      });
      if (!res.ok) throw new Error('Failed to create incident');
      toast({ title: 'Success', description: 'Incident created' });
      setIncDialogOpen(false);
      setIncTitle('');
      setIncMessage('');
      fetchData();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setIsIncSubmitting(false);
    }
  };

  const toggleMonitor = (monitorId: string) => {
    setSelectedMonitors(prev => {
      if (prev.includes(monitorId)) {
        return prev.filter(mid => mid !== monitorId);
      }
      return [...prev, monitorId];
    });
  };

  if (loading) {
    return (
      <ContentLayout>
        <div className="space-y-8 max-w-5xl mx-auto py-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-96 md:col-span-2" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </ContentLayout>
    );
  }

  if (!data) return null;

  const domain = process.env.NEXT_PUBLIC_CLIENT_URL ? new URL(process.env.NEXT_PUBLIC_CLIENT_URL).host : 'beacn.online';
  const isFree = user?.plan === 'FREE';

  return (
    <ContentLayout>
      <div className="space-y-8 max-w-5xl mx-auto py-6 animate-in fade-in-50 duration-500">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded bg-primary/5 text-primary">
              <Radio className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{data.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] font-medium h-5 border-muted-foreground/20">
                  {data.subdomain}.{domain}
                </Badge>
                <Button variant="ghost" size="sm" className="h-5 p-0 text-muted-foreground hover:text-primary transition-colors" asChild>
                  <a href={`/s/${data.subdomain}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-3" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={incDialogOpen} onOpenChange={setIncDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="font-bold h-9">
                  <Plus className="size-3.5 mr-2" /> New Incident
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px]">
                <form onSubmit={handleCreateIncident}>
                  <DialogHeader>
                    <DialogTitle>Create Incident</DialogTitle>
                    <DialogDescription>
                      Communicate a service disruption or planned maintenance.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="inc-title">Title</Label>
                      <Input
                        id="inc-title"
                        placeholder="e.g. Database Connectivity Issues"
                        required
                        value={incTitle}
                        onChange={e => setIncTitle(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1.5">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Severity</Label>
                        <Select value={incSeverity} onValueChange={setIncSeverity}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SEV3">Minor (SEV3)</SelectItem>
                            <SelectItem value="SEV2">Major (SEV2)</SelectItem>
                            <SelectItem value="SEV2_CRITICAL">Critical (SEV2)</SelectItem>
                            <SelectItem value="SEV1">Emergency (SEV1)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Status</Label>
                        <Select value={incStatus} onValueChange={setIncStatus}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                            <SelectItem value="IDENTIFIED">Identified</SelectItem>
                            <SelectItem value="MONITORING">Monitoring</SelectItem>
                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="inc-msg">Initial Message (Required)</Label>
                      <Textarea
                        id="inc-msg"
                        placeholder="We are currently investigating reports of..."
                        required
                        value={incMessage}
                        onChange={e => setIncMessage(e.target.value)}
                        className="min-h-[100px] text-sm"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isIncSubmitting} className="w-full font-bold">
                      {isIncSubmitting ? 'Creating...' : 'Create Incident'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Main Content: Incidents */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1 mb-2">
                <ShieldAlert className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Incident Timeline</h2>
              </div>

              <div className="space-y-3">
                {data.incidents.length === 0 ? (
                  <div className="p-16 border border-dashed rounded-xl flex flex-col items-center justify-center text-center bg-muted/5">
                    <div className="size-10 rounded-full bg-emerald-500/5 flex items-center justify-center text-emerald-500 mb-4">
                      <CheckCircle2 className="size-6" />
                    </div>
                    <h3 className="font-bold text-sm">Everything looks good</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                      No incidents have been recorded for this status page.
                    </p>
                  </div>
                ) : (
                  data.incidents.map(incident => (
                    <Card key={incident.id} className="shadow-none border hover:border-primary/30 transition-all cursor-pointer group bg-card/50" onClick={() => router.push(`/incidents/${incident.id}`)}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest px-2 h-5 bg-muted/50 text-muted-foreground border-transparent">
                                {incident.severity.replace('_', ' ')}
                              </Badge>
                              <Badge variant={incident.status === 'RESOLVED' ? 'outline' : 'secondary'} className={`text-[9px] font-black uppercase tracking-widest px-2 h-5 ${incident.status === 'RESOLVED' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : 'bg-amber-500/10 text-amber-600 border-transparent'}`}>
                                {incident.status}
                              </Badge>
                            </div>
                            <h3 className="font-bold text-base group-hover:text-primary transition-colors">{incident.title}</h3>
                            <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                              <div className="flex items-center gap-1.5"><Clock className="size-3" /> {format(new Date(incident.createdAt), 'MMM d, HH:mm')}</div>
                              <div className="flex items-center gap-1.5"><MessageSquare className="size-3" /> {incident.updates?.length || 0} updates</div>
                            </div>
                          </div>
                          <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-primary transition-colors mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar: Settings */}
          <div className="space-y-6">
            <Card className="shadow-none border overflow-hidden bg-card/30">
              <CardHeader className="pb-4 border-b bg-muted/20">
                <div className="flex items-center gap-2">
                  <Settings className="size-4 text-muted-foreground" />
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">General Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-5">
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Page Title</Label>
                    <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Description</Label>
                    <Textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="min-h-[80px] text-sm resize-none" />
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Monitors</Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {allMonitors
                        .filter(m => m.status === 'RUNNING' || selectedMonitors.includes(m.id))
                        .map(m => (
                        <div
                          key={m.id}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all
                                    ${selectedMonitors.includes(m.id) ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/10' : 'bg-muted/5 hover:bg-muted/10'}
                                `}
                          onClick={() => toggleMonitor(m.id)}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <MonitorIcon className={`size-3 ${selectedMonitors.includes(m.id) ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div className="flex flex-col">
                                <span className={selectedMonitors.includes(m.id) ? 'font-bold' : ''}>{m.name || m.url}</span>
                                {m.status !== 'RUNNING' && (
                                    <span className="text-[8px] text-amber-600 font-bold uppercase tracking-tighter">Paused - Not reporting</span>
                                )}
                            </div>
                          </div>
                          {selectedMonitors.includes(m.id) && <CheckCircle2 className="size-3 text-primary" />}
                        </div>
                      ))}
                    </div>
                    {isFree && selectedMonitors.length > 1 && (
                      <p className="text-[9px] text-rose-500 font-bold uppercase tracking-tighter">Free tier allows only 1 monitor</p>
                    )}
                  </div>

                  <div className="grid gap-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Custom Domain</Label>
                    <Input
                      placeholder="e.g. status.mycompany.com"
                      value={editCustomDomain}
                      onChange={e => setEditCustomDomain(e.target.value)}
                      className="h-9 text-sm"
                    />
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded p-3 space-y-2 mt-1">
                      <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">Setup Instructions</p>
                      <ol className="text-[9px] text-muted-foreground space-y-1 list-decimal pl-3">
                        <li>Add your custom domain above.</li>
                        <li>Create a <strong>CNAME</strong> record in your DNS.</li>
                        <li>Point it to <code>beacn.online</code></li>
                      </ol>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 pb-6 px-6">
                <Button size="sm" className="w-full font-bold h-9" onClick={handleUpdateSettings} disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Save Settings'}
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-none border border-rose-500/10 bg-rose-500/5 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-rose-500 uppercase tracking-widest">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-[10px] text-muted-foreground leading-relaxed mb-4">Deleting this page will immediately disable the public URL and all historical incident data.</p>
                <Button variant="outline" size="sm" className="w-full font-bold h-8 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">
                  Delete Status Page
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </ContentLayout>
  );
}
