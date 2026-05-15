'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContentLayout } from '@/components/dashboard/content-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { 
  ShieldAlert, 
  MessageSquare, 
  Clock,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  History
} from 'lucide-react';
import { format } from 'date-fns';

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
  statusPage: {
    title: string;
    subdomain: string;
  };
  updates: {
    message: string;
    createdAt: string;
  }[];
}

export default function IncidentsPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/incidents');
      if (!res.ok) throw new Error('Failed to load incidents');
      
      if (res.status === 204) {
        setIncidents([]);
        return;
      }

      const json = await res.json();
      setIncidents(json);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const filteredIncidents = incidents.filter(inc => {
    if (filter === 'ACTIVE') return inc.status !== 'RESOLVED';
    if (filter === 'RESOLVED') return inc.status === 'RESOLVED';
    return true;
  });

  if (loading) {
    return (
      <ContentLayout>
        <div className="space-y-8 max-w-5xl mx-auto py-6">
          <Skeleton className="h-10 w-48" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        </div>
      </ContentLayout>
    );
  }

  const activeCount = incidents.filter(i => i.status !== 'RESOLVED').length;

  return (
    <ContentLayout>
      <div className="space-y-8 max-w-5xl mx-auto py-6 animate-in fade-in-50 duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Incidents</h1>
            <p className="text-sm text-muted-foreground">Monitor and manage all service disruptions across your status pages.</p>
          </div>
          <div className="flex bg-muted/50 p-1 rounded-lg border">
            <Button 
              variant={filter === 'ALL' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 text-xs font-bold uppercase tracking-tighter"
              onClick={() => setFilter('ALL')}
            >
              All
            </Button>
            <Button 
              variant={filter === 'ACTIVE' ? 'secondary' : 'ghost'} 
              size="sm" 
              className={`h-8 text-xs font-bold uppercase tracking-tighter ${activeCount > 0 ? 'text-amber-600' : ''}`}
              onClick={() => setFilter('ACTIVE')}
            >
              Active {activeCount > 0 && `(${activeCount})`}
            </Button>
            <Button 
              variant={filter === 'RESOLVED' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 text-xs font-bold uppercase tracking-tighter"
              onClick={() => setFilter('RESOLVED')}
            >
              Resolved
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-1">
            <Card className="shadow-none border border-amber-500/10 bg-amber-500/[0.02]">
                <CardContent className="p-3.5 flex items-center gap-3">
                    <div className="p-2 rounded bg-amber-500/10 text-amber-600">
                        <AlertTriangle className="size-4" />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-amber-700 leading-tight">{activeCount}</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ongoing</div>
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-none border border-emerald-500/10 bg-emerald-500/[0.02]">
                <CardContent className="p-3.5 flex items-center gap-3">
                    <div className="p-2 rounded bg-emerald-500/10 text-emerald-600">
                        <CheckCircle2 className="size-4" />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-emerald-700 leading-tight">{incidents.filter(i => i.status === 'RESOLVED').length}</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Resolved</div>
                    </div>
                </CardContent>
            </Card>
            <Card className="shadow-none border border-primary/10 bg-primary/[0.02]">
                <CardContent className="p-3.5 flex items-center gap-3">
                    <div className="p-2 rounded bg-primary/10 text-primary">
                        <History className="size-4" />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-primary leading-tight">{incidents.length}</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total</div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Incidents List */}
        <div className="space-y-4">
          {filteredIncidents.length === 0 ? (
            <div className="p-16 border border-dashed rounded-xl flex flex-col items-center justify-center text-center bg-muted/5">
              <ShieldAlert className="size-8 text-muted-foreground/30 mb-4" />
              <h3 className="text-sm font-bold">No incidents found</h3>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-[250px] leading-relaxed">
                {filter === 'ACTIVE' ? "Everything looks good! No active incidents at the moment." : "No incident history recorded yet."}
              </p>
            </div>
          ) : (
            filteredIncidents.map(incident => (
              <Card key={incident.id} className="shadow-none border hover:border-primary/40 transition-all cursor-pointer group overflow-hidden bg-card/50" onClick={() => router.push(`/incidents/${incident.id}`)}>
                <CardContent className="p-0">
                  <div className="flex items-stretch h-full">
                    {/* Severity Indicator Strip */}
                    <div className={`w-1.5 shrink-0 
                      ${incident.severity === 'SEV1' ? 'bg-rose-500' : 
                        incident.severity === 'SEV2_CRITICAL' ? 'bg-orange-600' : 
                        incident.severity === 'SEV2' ? 'bg-amber-500' : 'bg-blue-400'}
                    `} />
                    
                    <div className="px-4 py-3 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest px-1.5 h-4 border-muted-foreground/20 text-muted-foreground/60">
                            {incident.statusPage.title}
                          </Badge>
                          <Badge variant="secondary" className={`text-[8px] font-bold uppercase tracking-widest px-1.5 h-4 border-transparent 
                            ${incident.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                            {incident.status}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate max-w-md">{incident.title}</h3>
                        <div className="flex items-center gap-3 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                          <div className="flex items-center gap-1"><Clock className="size-2.5" /> {format(new Date(incident.createdAt), 'MMM d, HH:mm')}</div>
                          <div className="flex items-center gap-1"><MessageSquare className="size-2.5" /> {incident.updates?.length || 0} UPDATES</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                        <div className="text-right hidden sm:block">
                            <div className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">Severity</div>
                            <div className="text-[10px] font-black uppercase tracking-tight text-foreground/80">{incident.severity.replace('_', ' ')}</div>
                        </div>
                        <div className="p-1 rounded-full group-hover:bg-primary/10 transition-all text-muted-foreground/10 group-hover:text-primary">
                          <ChevronRight className="size-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

      </div>
    </ContentLayout>
  );
}
