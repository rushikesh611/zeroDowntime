'use client';

import { ContentLayout } from '@/components/dashboard/content-layout';
import { fetchWithAuth } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import Circles from '@/components/circles';
import RegionalAvailabilityChart from '@/components/dashboard/regional-availability-chart';
import RegionalResponseChart from '@/components/dashboard/regional-response-chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store/useAppStore';
import { Monitor, MonitorLog } from '@/types';
import { Clock, Globe, Mail, PauseIcon, PlayIcon, SendHorizonalIcon, Settings } from 'lucide-react';

const MonitorDetailsPage = () => {
  const { id } = useParams() as { id: string };

  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [monitorLogs, setMonitorLogs] = useState<MonitorLog[]>([]);

  const { pauseMonitor, startMonitor, fetchMonitorById } = useAppStore();

  const router = useRouter();

  useEffect(() => {
    fetchMonitorById(id).then((monitor) => {
      if (monitor) {
        setMonitor(monitor);
      }
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

  const handleConfigure = (monitorId: string) => {
    router.push(`/monitors/${monitorId}/update`);
  };

  const handleTestAlert = (monitorId: string) => {
    fetchWithAuth(`/api/monitors/${monitorId}/test-email`, {
      method: 'POST'
    }).then(() => console.log('Test alert sent'));
  };

  return (
    <ContentLayout>
      {/* Header Card */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <Circles isPaused={monitor?.status === 'PAUSED'} />
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight break-words">
                  {monitor?.url}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <Badge
                    variant={monitor?.status === 'PAUSED' ? 'secondary' : 'default'}
                    className={monitor?.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : 'bg-green-100 text-green-800 hover:bg-green-100'}
                  >
                    {monitor?.status}
                  </Badge>
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Every {monitor?.frequency}s
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => monitor && handleTestAlert(monitor.id)}
            >
              <SendHorizonalIcon className="mr-2 w-4 h-4" />
              Send Test Alert
            </Button>
            <Button variant="outline" size="sm">
              {monitor?.status === 'PAUSED' ? (
                <div
                  className="flex items-center"
                  onClick={() => startMonitor(monitor.id).then(() => {
                    setMonitor({ ...monitor, status: 'RUNNING' });
                  })}
                >
                  <PlayIcon className="mr-2 w-4 h-4" />
                  Start Monitor
                </div>
              ) : (
                <div
                  className="flex items-center"
                  onClick={() => monitor && pauseMonitor(monitor.id).then(() => {
                    setMonitor({ ...monitor, status: 'PAUSED' });
                  })}
                >
                  <PauseIcon className="mr-2 w-4 h-4" />
                  Pause Monitor
                </div>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => monitor && handleConfigure(monitor.id)}
            >
              <Settings className="mr-2 w-4 h-4" />
              Configure
            </Button>
          </div>

          <Separator />

          {/* Monitor Info Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Email Contacts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>Email Contacts</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {monitor?.emails.map((email) => (
                  <Badge key={email} variant="secondary" className="font-normal">
                    {email}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Monitoring Regions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span>Monitoring Regions</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {monitor?.regions.map((region) => (
                  <Badge key={region} variant="secondary" className="font-normal">
                    {region}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="mt-8 space-y-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Regional Availability</CardTitle>
            <CardDescription>Monitor uptime across different regions</CardDescription>
          </CardHeader>
          <CardContent>
            <RegionalAvailabilityChart data={monitorLogs} />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Regional Response Times</CardTitle>
            <CardDescription>Average response times by region</CardDescription>
          </CardHeader>
          <CardContent>
            <RegionalResponseChart data={monitorLogs} />
          </CardContent>
        </Card>
      </div>
    </ContentLayout>
  );
};

export default MonitorDetailsPage;