'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ContentLayout } from '@/components/dashboard/content-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { 
  ShieldAlert, 
  MessageSquare, 
  Clock,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  Activity,
  AlertTriangle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { format } from 'date-fns';

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
  postMortem?: string;
  createdAt: string;
  resolvedAt?: string;
  statusPage: {
    id: string;
    title: string;
    subdomain: string;
  };
  updates: IncidentUpdate[];
}

export default function IncidentDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Update state
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateSeverity, setUpdateSeverity] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Post mortem state
  const [postMortem, setPostMortem] = useState('');
  const [isSavingPM, setIsSavingPM] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/incidents/${id}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw { message: data.error || 'Failed to load incident', status: res.status };
      }
      const json = await res.json();
      setIncident(json);
      setUpdateStatus(json.status);
      setUpdateSeverity(json.severity);
      setPostMortem(json.postMortem || '');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: getFriendlyErrorMessage(err, 'Failed to load incident') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateMessage) {
        toast({ variant: 'destructive', title: 'Error', description: 'Update message is required' });
        return;
    }
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/incidents/${id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            message: updateMessage, 
            status: updateStatus,
            severity: updateSeverity
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw { message: data.error || 'Failed to post update', status: res.status };
      }
      toast({ title: 'Update posted' });
      setUpdateMessage('');
      fetchData();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: getFriendlyErrorMessage(err, 'Failed to post update') });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSavePostMortem = async () => {
    setIsSavingPM(true);
    try {
      const res = await fetch(`/api/incidents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postMortem })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw { message: data.error || 'Failed to save', status: res.status };
      }
      toast({ title: 'Post-mortem saved' });
      fetchData();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: getFriendlyErrorMessage(err, 'Failed to save post-mortem') });
    } finally {
      setIsSavingPM(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/incidents/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw { message: data.error || 'Failed to delete incident', status: res.status };
      }
      router.push('/incidents');
      toast({ title: 'Incident deleted' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: getFriendlyErrorMessage(err, 'Failed to delete incident') });
    }
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

  if (!incident) return null;

  return (
    <ContentLayout>
      <div className="space-y-8 max-w-5xl mx-auto py-6 animate-in fade-in-50 duration-500">
        
        {/* Navigation */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-0 h-auto hover:bg-transparent text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="size-3.5 mr-1.5" /> Back
            </Button>
            <span className="opacity-30">/</span>
            <span>Incidents</span>
            <span className="opacity-30">/</span>
            <span className="text-foreground">{incident.title}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest px-2 h-5 border-primary/20 bg-primary/5 text-primary">
                {incident.severity.replace('_', ' ')}
              </Badge>
              <Badge className={`text-[10px] uppercase font-black tracking-widest px-2 h-5 ${incident.status === 'RESOLVED' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                {incident.status}
              </Badge>
            </div>
            <h1 className="text-2xl font-black tracking-tight">{incident.title}</h1>
            <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                <div className="flex items-center gap-1.5"><Activity className="size-3 text-primary" /> {incident.statusPage.title}</div>
                <div className="flex items-center gap-1.5"><Clock className="size-3" /> Started {format(new Date(incident.createdAt), 'MMM d, HH:mm')}</div>
                {incident.resolvedAt && <div className="flex items-center gap-1.5 text-emerald-600 font-bold"><CheckCircle2 className="size-3" /> Resolved {format(new Date(incident.resolvedAt), 'HH:mm')}</div>}
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-4 font-bold text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white">
                <Trash2 className="size-3.5 mr-2" /> Delete Incident
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Incident</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure? This will immediately remove the incident from the public status page. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-rose-500 text-white hover:bg-rose-600"
                >
                  Delete Incident
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Timeline & Updates */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-none border border-muted-foreground/10 overflow-hidden bg-card/30">
                <CardHeader className="pb-4 border-b bg-muted/20">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <MessageSquare className="size-3.5 text-primary" />
                        Communication Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-8">
                    <div className="space-y-8 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-muted-foreground/10">
                        {incident.updates.map((update) => (
                            <div key={update.id} className="relative">
                                <div className={`absolute -left-[22px] top-1.5 size-3 rounded-full bg-background border-2 z-10 ${update.status === 'RESOLVED' ? 'border-emerald-500' : 'border-amber-500'}`} />
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-black uppercase tracking-tighter ${update.status === 'RESOLVED' ? 'text-emerald-600' : 'text-amber-600'}`}>{update.status}</span>
                                        <span className="text-[9px] font-bold text-muted-foreground/20">•</span>
                                        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">{format(new Date(update.createdAt), 'MMM d, HH:mm')}</span>
                                    </div>
                                    <p className="text-xs leading-relaxed text-muted-foreground bg-muted/5 p-4 rounded-lg border border-muted-foreground/5 shadow-sm">{update.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t p-6">
                    <form onSubmit={handlePostUpdate} className="w-full space-y-6">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Post a new update (Required)</Label>
                                <Textarea 
                                    placeholder="Briefly describe the current situation or resolution..." 
                                    value={updateMessage}
                                    onChange={e => setUpdateMessage(e.target.value)}
                                    className="min-h-[100px] bg-background text-sm resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 items-end">
                                <div className="grid gap-1.5">
                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">New Status</Label>
                                    <Select value={updateStatus} onValueChange={setUpdateStatus}>
                                        <SelectTrigger className="h-9 bg-background text-xs">
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
                                <div className="grid gap-1.5">
                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">New Severity</Label>
                                    <Select value={updateSeverity} onValueChange={setUpdateSeverity}>
                                        <SelectTrigger className="h-9 bg-background text-xs">
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
                                <Button className="h-9 font-bold col-span-2 md:col-span-1" disabled={isUpdating || !updateMessage}>
                                    <Send className="size-3 mr-2" /> {isUpdating ? 'Posting...' : 'Post Update'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardFooter>
            </Card>
          </div>

          {/* Post Mortem / RCA */}
          <div className="space-y-6">
            <Card className="shadow-none border border-muted-foreground/10 overflow-hidden bg-card/30">
                <CardHeader className="bg-muted/30 border-b pb-4">
                    <div className="flex items-center gap-2">
                        <FileText className="size-3.5 text-muted-foreground" />
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Post Mortem / RCA</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded p-4 flex gap-3">
                        <AlertCircle className="size-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                            Document the root cause and long-term prevention steps for internal reference. This content is currently private.
                        </p>
                    </div>
                    <Textarea 
                        placeholder="What happened? Why? How to prevent?" 
                        value={postMortem}
                        onChange={e => setPostMortem(e.target.value)}
                        className="min-h-[250px] text-xs resize-none bg-muted/5 border-dashed"
                    />
                    <Button variant="outline" size="sm" className="w-full font-bold h-9" onClick={handleSavePostMortem} disabled={isSavingPM}>
                        {isSavingPM ? 'Saving...' : 'Save RCA Data'}
                    </Button>
                </CardContent>
            </Card>

            <Card className="shadow-none border border-muted-foreground/10 overflow-hidden bg-muted/5">
                <CardContent className="p-4 space-y-3">
                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60 flex items-center gap-2">
                        <Activity className="size-3" /> Impacted Environment
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{incident.statusPage.title}</span>
                        <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-black uppercase tracking-widest" asChild>
                            <a href={`/statuspage/${incident.statusPage.id}`}>View Page</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </ContentLayout>
  );
}
