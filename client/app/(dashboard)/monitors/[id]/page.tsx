'use client';

import { ContentLayout } from '@/components/dashboard/content-layout';
import { fetchWithAuth } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import RegionalAvailabilityChart from '@/components/dashboard/regional-availability-chart';
import RegionalResponseChart from '@/components/dashboard/regional-response-chart';
import { useAppStore } from '@/store/useAppStore';
import { Monitor, MonitorLog } from '@/types';
import { Activity, ArrowLeft, BellIcon, Clock, Globe, PauseIcon, PlayIcon, Settings } from 'lucide-react';

const MonitorDetailsPage = () => {
  const { id } = useParams() as { id: string };
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [monitorLogs, setMonitorLogs] = useState<MonitorLog[]>([]);
  const [stats, setStats] = useState<{ avg: number, p95: number, p99: number, count: number } | null>(null);
  const { pauseMonitor, startMonitor, fetchMonitorById } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    fetchMonitorById(id).then((monitor) => {
      if (monitor) setMonitor(monitor);
    });

    const fetchData = async () => {
      try {
        const monitorLogs = await fetchWithAuth('/api/monitors/' + id + '/logs');
        if (monitorLogs.ok) {
          const result = await monitorLogs.json();
          setMonitorLogs(result.flat());
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    const fetchStats = async () => {
        try {
          const response = await fetchWithAuth(`/api/monitors/${id}/stats`);
          if (response.ok) {
            const result = await response.json();
            setStats(result);
          }
        } catch (error) {
          console.error('Error fetching stats:', error);
        }
      };

    fetchData();
    fetchStats();

    // Set up polling for real-time updates
    const intervalId = setInterval(() => {
      fetchData();
      fetchStats();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [id, fetchMonitorById]);

  const handleConfigure = (monitorId: string) => router.push(`/monitors/${monitorId}/update`);
  const handleTestAlert = (monitorId: string) => {
    fetchWithAuth(`/api/monitors/${monitorId}/test-email`, { method: 'POST' })
      .then(() => console.log('Test alert sent'));
  };

  const isRunning = monitor?.status === 'RUNNING';

  const avgResponseTime = stats?.avg || 0;
  const p95 = stats?.p95 || 0;
  const p99 = stats?.p99 || 0;

  return (
    <ContentLayout>
      <div className="space-y-5 animate-in fade-in-50 duration-500">

        {/* Back nav */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Monitors
        </button>

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
          {/* Ambient background blobs */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-secondary/5 to-transparent rounded-full -ml-12 -mb-12 pointer-events-none" />

          <div className="relative p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Status Indicator */}
              <div className="relative shrink-0 flex items-center justify-center w-12 h-12">
                <div className={`w-4 h-4 rounded-full z-10 relative ${isRunning ? 'bg-secondary' : 'bg-tertiary'}`} />
                {isRunning && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-secondary/20 animate-ping" />
                    <div className="absolute inset-[-8px] rounded-full bg-secondary/10 animate-ping animation-delay-300" />
                  </>
                )}
                {!isRunning && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-tertiary/20 animate-ping" />
                    <div className="absolute inset-[-8px] rounded-full bg-tertiary/10 animate-ping animation-delay-300" />
                  </>
                )}
              </div>

              {/* Monitor Info */}
              <div className="flex-1 min-w-0 space-y-2">
                <div>
                  <h1 className="text-lg font-semibold text-on-surface tracking-tight break-all">
                    {monitor?.name || monitor?.url || `${monitor?.host}:${monitor?.port}`}
                  </h1>
                  {monitor?.name && (
                    <p className="text-xs font-medium text-on-surface-variant break-all mt-0.5 opacity-80">
                      {monitor?.url || `${monitor?.host}:${monitor?.port}`}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      isRunning
                        ? 'bg-secondary/10 text-secondary'
                        : 'bg-tertiary/10 text-tertiary'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-secondary' : 'bg-tertiary'}`} />
                      {monitor?.status || '–'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Every {monitor?.frequency}s
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                      {monitor?.url ? 'HTTP' : 'TCP'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => {
                      if (!monitor) return;
                      isRunning
                        ? pauseMonitor(monitor.id).then(() => setMonitor({ ...monitor, status: 'PAUSED' }))
                        : startMonitor(monitor.id).then(() => setMonitor({ ...monitor, status: 'RUNNING' }));
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      isRunning
                        ? 'bg-tertiary/10 text-tertiary hover:bg-tertiary/20'
                        : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                    }`}
                  >
                    {isRunning ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                    {isRunning ? 'Pause Monitor' : 'Start Monitor'}
                  </button>
                  <button
                    onClick={() => monitor && handleConfigure(monitor.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Configure
                  </button>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid gap-6 md:grid-cols-2 mt-6 pt-6 border-t border-surface-container-high/50">
              {/* Notification Channel */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  <BellIcon className="w-3.5 h-3.5" />
                  Notification Channel
                </div>
                <div className="flex flex-wrap gap-2">
                  {monitor?.notifier ? (
                    <div className="flex flex-col gap-1.5 p-3 rounded-2xl bg-surface-container border border-surface-container-high w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-on-surface">{monitor.notifier.name}</span>
                        <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-black">
                          {monitor.notifier.type}
                        </span>
                      </div>
                      <span className="text-xs text-on-surface-variant font-medium truncate">
                        {monitor.notifier.details}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-on-surface-variant font-medium">No channel configured</span>
                  )}
                </div>
              </div>

              {/* Monitoring Regions */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  <Globe className="w-3.5 h-3.5" />
                  Monitoring Regions
                </div>
                <div className="flex flex-wrap gap-2">
                  {monitor?.regions?.length ? monitor.regions.map((region) => (
                    <span key={region} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {region}
                    </span>
                  )) : (
                    <span className="text-sm text-on-surface-variant font-medium">No regions configured</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Performance Summary</h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 text-primary/70 text-[10px] font-bold border border-primary/10">
              <Clock className="w-3 h-3" />
              Last 24 Hours
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
              <Activity className="w-8 h-8 text-on-surface" />
            </div>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mb-2">Avg Latency</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-on-surface tracking-tight">{avgResponseTime}</span>
              <span className="text-sm font-bold text-on-surface-variant/70">ms</span>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high/40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform text-secondary">
                  <Activity className="w-8 h-8" />
              </div>
            <p className="text-[10px] font-black text-secondary/80 uppercase tracking-[0.2em] mb-2">p95 Latency</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-secondary tracking-tight">{p95}</span>
              <span className="text-sm font-bold text-on-surface-variant/70">ms</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container-high/40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform text-primary">
                  <Activity className="w-8 h-8" />
              </div>
            <p className="text-[10px] font-black text-primary/80 uppercase tracking-[0.2em] mb-2">p99 Latency</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-primary tracking-tight">{p99}</span>
              <span className="text-sm font-bold text-on-surface-variant/70">ms</span>
            </div>
          </div>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-3">
          {/* Availability Chart */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-on-surface tracking-tight">Regional Availability</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">Monitor uptime across different regions</p>
            </div>
            <RegionalAvailabilityChart data={monitorLogs} />
          </div>

          {/* Response Time Chart */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-on-surface tracking-tight">Regional Response Times</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">Average response times by region</p>
            </div>
            <RegionalResponseChart data={monitorLogs} />
          </div>
        </div>
      </div>
    </ContentLayout>
  );
};

export default MonitorDetailsPage;