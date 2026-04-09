'use client';

import { ContentLayout } from '@/components/dashboard/content-layout';
import { fetchWithAuth } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import RegionalAvailabilityChart from '@/components/dashboard/regional-availability-chart';
import RegionalResponseChart from '@/components/dashboard/regional-response-chart';
import { useAppStore } from '@/store/useAppStore';
import { Monitor, MonitorLog } from '@/types';
import { ArrowLeft, Clock, Globe, Mail, PauseIcon, PlayIcon, SendHorizonalIcon, Settings } from 'lucide-react';

const MonitorDetailsPage = () => {
  const { id } = useParams() as { id: string };
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [monitorLogs, setMonitorLogs] = useState<MonitorLog[]>([]);
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
    fetchData();
  }, [id, fetchMonitorById]);

  const handleConfigure = (monitorId: string) => router.push(`/monitors/${monitorId}/update`);
  const handleTestAlert = (monitorId: string) => {
    fetchWithAuth(`/api/monitors/${monitorId}/test-email`, { method: 'POST' })
      .then(() => console.log('Test alert sent'));
  };

  const isRunning = monitor?.status === 'RUNNING';

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
                    {monitor?.url || `${monitor?.host}:${monitor?.port}`}
                  </h1>
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
                    onClick={() => monitor && handleTestAlert(monitor.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container text-on-surface text-sm font-semibold hover:bg-surface-container-high transition-colors"
                  >
                    <SendHorizonalIcon className="w-4 h-4" />
                    Send Test Alert
                  </button>
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
              {/* Email Contacts */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  <Mail className="w-3.5 h-3.5" />
                  Email Contacts
                </div>
                <div className="flex flex-wrap gap-2">
                  {monitor?.emails?.length ? monitor.emails.map((email) => (
                    <span key={email} className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface text-xs font-medium">
                      {email}
                    </span>
                  )) : (
                    <span className="text-sm text-on-surface-variant font-medium">No contacts configured</span>
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