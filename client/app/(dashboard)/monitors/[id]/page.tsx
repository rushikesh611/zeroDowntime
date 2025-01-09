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
import { useAppStore } from '@/store/useAppStore';
import { PauseIcon, PlayIcon, SendHorizonalIcon, Settings, ShieldAlert } from 'lucide-react';
import { Monitor, MonitorLog } from '@/types';


const MonitorDetailsPage = () => {
  const { id } = useParams() as { id: string }

  const [monitor, setMonitor] = useState<Monitor | null>(null)
  const [monitorLogs, setMonitorLogs] = useState<MonitorLog[]>([])

  const { pauseMonitor, startMonitor, fetchMonitorById } = useAppStore()

  const router = useRouter();

  useEffect(() => {
    fetchMonitorById(id).then((monitor) => {
      if (monitor) {
        setMonitor(monitor)
      }
    })

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

  }, [id, fetchMonitorById])


  const handleConfigure = (monitorId: string) => {
    router.push(`/monitors/${monitorId}/update`);
  }

  return (
    <ContentLayout title={`Monitor  >  ${monitor?.id}`}>

      <div className='w-full mt-8 mb-12'>
        <div className='flex flex-row items-center'>
          <Circles isPaused={monitor?.status === 'PAUSED'} />
          <div className='ml-3 flex flex-col'>
            <h3 className="text-lg font-medium">{monitor?.url}</h3>
            <p className="line-clamp-2 text-xs text-muted-foreground mt-1">
              <span className={monitor?.status === 'PAUSED' ? 'text-yellow-500 font-medium' : 'text-green-500 font-medium'}>{monitor?.status}</span> • Checked every {monitor?.frequency} seconds
            </p>
          </div>
        </div>
      </div>

      <div className='w-full my-12 flex flex-wrap gap-4'>
        <Button variant='ghost'><SendHorizonalIcon className='mr-2 w-5 h-5' /> Send test alert</Button>
        <Button variant='ghost'><ShieldAlert className='mr-2 w-5 h-5' /> Incident</Button>
        <Button variant='ghost'>
          {monitor?.status === 'PAUSED' ? (
            <div className="flex items-center" onClick={() => startMonitor(monitor.id).then(() => { setMonitor({ ...monitor, status: 'RUNNING' }); console.log('Start monitor:', monitor.id); })}>
              <PlayIcon className='mr-2 w-5 h-5' />
              Start
            </div>
          ) : (
            <div className="flex items-center" onClick={() => monitor && pauseMonitor(monitor.id).then(() => { setMonitor({ ...monitor, status: 'PAUSED' }); console.log('Pause monitor:', monitor.id); })}>
              <PauseIcon className='mr-2 w-5 h-5' />
              Pause
            </div>
          )
          }
        </Button>
        <Button variant='ghost' onClick={() => monitor && handleConfigure(monitor.id)}><Settings className='mr-2 w-5 h-5' /> Configure</Button>
      </div>

      <div className='px-3 mb-8'>
        <RegionalAvailabilityChart data={monitorLogs} />
      </div>
      <div className='px-3 mb-8'>
        <RegionalResponseChart data={monitorLogs} />
      </div>

      <div className='flex flex-row px-3'>
        <p className="line-clamp-2 text-sm font-medium text-muted-foreground mr-4">POC :</p>
        <div className='flex flex-wrap gap-2'>
          {monitor?.emails.map((email) => (
            <Badge key={email} variant='outline'>{email}</Badge>
          ))}
        </div>
      </div>
    </ContentLayout>
  )
}

export default MonitorDetailsPage