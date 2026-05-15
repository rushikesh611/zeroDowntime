'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
    CheckCircle2, 
    AlertCircle, 
    XCircle, 
    Clock, 
    ChevronRight, 
    TowerControl, 
    ExternalLink,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
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
  updates: IncidentUpdate[];
}

interface Monitor {
    id: string;
    name: string;
    url: string;
    status: string;
}

interface StatusPageData {
  statusPage: {
    id: string;
    title: string;
    description: string;
    monitors: Monitor[];
  };
  dailyUptimeByMonitor: Record<string, {
    date: string;
    uptime: string;
    status: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE' | 'NO_DATA';
    totalChecks: number;
  }[]>;
  activeIncidents: Incident[];
  pastIncidents: Incident[];
}

export default function PublicStatusPage() {
  const { subdomain } = useParams();
  const [data, setData] = useState<StatusPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIncidents, setExpandedIncidents] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/status-pages/public/${subdomain}`);
        if (!res.ok) throw new Error('Status page not found');
        
        if (res.status === 204) {
          setData(null);
          return;
        }

        const json = await res.json();
        setData(json);
        
        // If there are no active incidents, expand the most recent past one by default
        if (json.activeIncidents.length === 0 && json.pastIncidents.length > 0) {
            setExpandedIncidents({ [json.pastIncidents[0].id]: true });
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [subdomain]);

  const toggleIncident = (id: string) => {
    setExpandedIncidents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-12 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
            <TowerControl className="size-6 text-muted-foreground" />
            <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
        <XCircle className="size-10 text-muted-foreground/30 mb-4" />
        <h1 className="text-xl font-bold">Page not found</h1>
        <p className="text-sm text-muted-foreground mt-1">This status page doesn't exist or is set to private.</p>
        <Button variant="outline" size="sm" className="mt-6" asChild>
            <a href="/">Back to Beacn</a>
        </Button>
      </div>
    );
  }

  const isGlobalOperational = data.statusPage.monitors.every(m => m.status === 'RUNNING') && data.activeIncidents.length === 0;

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/5">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-24 space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b pb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded bg-primary/5 text-primary">
                <TowerControl className="size-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">{data.statusPage.title}</h1>
            </div>
            {data.statusPage.description && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">{data.statusPage.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-full uppercase tracking-widest border border-muted-foreground/10">
              <div className={`size-1.5 rounded-full ${isGlobalOperational ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
              Live System Status
            </div>
          </div>
        </div>

        {/* Global Banner */}
        <div className={`rounded-lg p-5 flex items-center justify-between border shadow-sm transition-colors
            ${isGlobalOperational ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/20' : 'bg-amber-50/50 border-amber-100 dark:bg-amber-500/5 dark:border-amber-500/20'}
        `}>
            <div className="flex items-center gap-4">
                {isGlobalOperational ? 
                    <CheckCircle2 className="size-6 text-emerald-500" /> : 
                    <AlertCircle className="size-6 text-amber-500" />
                }
                <div>
                    <h2 className={`font-bold text-sm ${isGlobalOperational ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        {isGlobalOperational ? 'All Systems Operational' : 'Partial System Issues'}
                    </h2>
                    <p className="text-[10px] text-muted-foreground opacity-80 mt-0.5">Verified as of {format(new Date(), 'HH:mm')} UTC</p>
                </div>
            </div>
            <Button variant="outline" size="sm" className="text-[10px] h-7 font-bold uppercase tracking-widest px-3 border-muted-foreground/10 hover:bg-background">
                Subscribe
            </Button>
        </div>

        {/* Monitors Grid */}
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Uptime History (7 Days)</h3>
            </div>
            
            <div className="space-y-4">
                {data.statusPage.monitors.map(monitor => (
                    <Card key={monitor.id} className="shadow-none border border-muted-foreground/10 bg-muted/5">
                        <CardContent className="p-4 md:p-6 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="space-y-0.5">
                                    <div className="text-sm font-bold truncate max-w-[200px]">{monitor.name || monitor.url}</div>
                                    <div className="text-[10px] font-medium text-muted-foreground/60 flex items-center gap-1.5 truncate max-w-[250px]">
                                        <ExternalLink className="size-2.5" /> {monitor.url}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-emerald-500">99.9%</div>
                                    <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Availability</div>
                                </div>
                            </div>

                            {/* Uptime Bar */}
                            <div className="flex gap-1 h-8 items-end">
                                {data.dailyUptimeByMonitor[monitor.id]?.map((day, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`flex-1 rounded-sm transition-all duration-200 cursor-help group relative
                                            ${day.status === 'OPERATIONAL' ? 'bg-emerald-500/60 hover:bg-emerald-500' : 
                                              day.status === 'DEGRADED' ? 'bg-amber-500/60 hover:bg-amber-500' : 
                                              day.status === 'OUTAGE' ? 'bg-rose-500/60 hover:bg-rose-500' : 'bg-muted-foreground/10'}
                                        `}
                                        style={{ height: '100%' }}
                                    >
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-foreground text-background text-[9px] rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg font-medium">
                                            <div className="border-b border-background/10 pb-1 mb-1 opacity-60">{format(new Date(day.date), 'MMM d, yyyy')}</div>
                                            <div className="flex justify-between gap-3">
                                                <span>Uptime</span>
                                                <span className={day.status === 'OPERATIONAL' ? 'text-emerald-300' : 'text-amber-300'}>{day.uptime}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>

        {/* Active Incidents */}
        {data.activeIncidents.length > 0 && (
            <div className="space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-rose-500 px-1">Active Incidents</h3>
                <div className="space-y-4">
                    {data.activeIncidents.map(incident => (
                        <Card key={incident.id} className="border-l-4 border-l-amber-500 shadow-sm overflow-hidden">
                            <CardHeader className="p-5 pb-2">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest h-5 bg-amber-500/5 text-amber-600 border-amber-500/20 px-2">
                                        {incident.severity.replace('_', ' ')}
                                    </Badge>
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                        Since {format(new Date(incident.createdAt), 'MMM d, HH:mm')}
                                    </span>
                                </div>
                                <CardTitle className="text-base font-bold">{incident.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 pt-4 space-y-6">
                                <div className="relative pl-4 space-y-6 before:absolute before:left-0.5 before:top-1 before:bottom-1 before:w-px before:bg-muted-foreground/10">
                                    {incident.updates.map((update) => (
                                        <div key={update.id} className="relative">
                                            <div className="absolute -left-[17px] top-1 size-2 rounded-full bg-background border-2 border-amber-500 z-10" />
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black uppercase tracking-tighter text-amber-600">{update.status}</span>
                                                    <span className="text-[9px] font-bold text-muted-foreground/20">•</span>
                                                    <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">{format(new Date(update.createdAt), 'HH:mm')}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground leading-relaxed">{update.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )}

        {/* Past Incidents */}
        <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">Incident History</h3>
            <div className="space-y-2">
                {data.pastIncidents.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic text-center py-12 border border-dashed rounded-lg bg-muted/5">
                        All clear! No incidents reported in the last 7 days.
                    </div>
                ) : (
                    data.pastIncidents.map(incident => (
                        <div key={incident.id} className="border border-muted-foreground/10 rounded-lg overflow-hidden transition-all bg-muted/5">
                            <div 
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/10 transition-colors"
                                onClick={() => toggleIncident(incident.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="size-7 rounded bg-emerald-500/5 flex items-center justify-center text-emerald-600 border border-emerald-500/10">
                                        <CheckCircle2 className="size-3.5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold">{incident.title}</div>
                                        <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-widest mt-0.5 opacity-60">Resolved on {format(new Date(incident.createdAt), 'MMM d')}</div>
                                    </div>
                                </div>
                                {expandedIncidents[incident.id] ? <ChevronUp className="size-3.5 text-muted-foreground/50" /> : <ChevronDown className="size-3.5 text-muted-foreground/50" />}
                            </div>
                            
                            {expandedIncidents[incident.id] && (
                                <div className="px-12 pb-6 pt-2 border-t border-muted-foreground/5 bg-background/50">
                                    <div className="relative pl-4 space-y-6 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-px before:bg-muted-foreground/10">
                                        {incident.updates.map((update) => (
                                            <div key={update.id} className="relative">
                                                <div className="absolute -left-[17px] top-1 size-2 rounded-full bg-background border-2 border-emerald-500 z-10" />
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-600">{update.status}</span>
                                                        <span className="text-[9px] font-bold text-muted-foreground/20">•</span>
                                                        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">{format(new Date(update.createdAt), 'MMM d, HH:mm')}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">{update.message}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="pt-12 border-t flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 transition-opacity hover:opacity-100">
            <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                Powered by <span className="text-foreground flex items-center gap-1"><TowerControl className="size-3" /> Beacn</span>
            </div>
            <div className="flex items-center gap-6 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                <a href="#" className="hover:text-primary transition-colors">Incident Feed (RSS)</a>
                <a href="#" className="hover:text-primary transition-colors">Privacy</a>
                <a href="#" className="hover:text-primary transition-colors">Terms</a>
            </div>
        </div>

      </div>
    </div>
  );
}
