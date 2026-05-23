'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContentLayout } from '@/components/dashboard/content-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { getFriendlyErrorMessage } from '@/lib/errors';
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw { message: data.error || 'Failed to load incidents', status: res.status };
      }
      
      if (res.status === 204) {
        setIncidents([]);
        return;
      }

      const json = await res.json();
      setIncidents(json);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: getFriendlyErrorMessage(err, 'Failed to load incidents') });
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-border bg-card rounded-lg p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Incidents</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">{activeCount}</div>
            </div>
          </div>
          <div className="border border-border bg-card rounded-lg p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Resolved Incidents</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{incidents.filter(i => i.status === 'RESOLVED').length}</div>
            </div>
          </div>
          <div className="border border-border bg-card rounded-lg p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-md bg-muted text-muted-foreground border">
              <History className="size-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Incidents</div>
              <div className="text-2xl font-bold text-foreground mt-1">{incidents.length}</div>
            </div>
          </div>
        </div>

        {/* Incidents List */}
        <div className="space-y-4">
          {filteredIncidents.length === 0 ? (
            <div className="p-16 border border-dashed rounded-lg bg-card flex flex-col items-center justify-center text-center max-w-lg mx-auto">
              <ShieldAlert className="size-8 text-muted-foreground/30 mb-4" />
              <h3 className="text-sm font-bold text-foreground">No incidents found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-[320px] leading-relaxed">
                {filter === 'ACTIVE' ? "Everything looks good! No active incidents at the moment." : "No incident history recorded yet."}
              </p>
            </div>
          ) : (
            filteredIncidents.map(incident => (
              <div 
                key={incident.id} 
                className="border border-border bg-card rounded-lg overflow-hidden flex cursor-pointer hover:border-border/80 transition-colors group"
                onClick={() => router.push(`/incidents/${incident.id}`)}
              >
                {/* Severity Indicator Strip */}
                <div className={`w-1.5 shrink-0 
                  ${incident.severity === 'SEV1' ? 'bg-rose-500' : 
                    incident.severity === 'SEV2_CRITICAL' ? 'bg-orange-600' : 
                    incident.severity === 'SEV2' ? 'bg-amber-500' : 'bg-blue-400'}
                `} />
                
                <div className="px-5 py-4 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-wider px-1.5 h-4 border-muted-foreground/20 text-muted-foreground/60 rounded-md">
                        {incident.statusPage.title}
                      </Badge>
                      <Badge variant="secondary" className={`text-[8px] font-bold uppercase tracking-wider px-1.5 h-4 border border-transparent rounded-md 
                        ${incident.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
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
                    <div className="p-1 rounded-full group-hover:bg-muted transition-colors text-muted-foreground/40 group-hover:text-foreground">
                      <ChevronRight className="size-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </ContentLayout>
  );
}
