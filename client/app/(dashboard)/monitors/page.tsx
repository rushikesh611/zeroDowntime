'use client'

import Circles from "@/components/circles";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDateDifference } from "@/lib/utils";
import { useAppStore } from '@/store/useAppStore';
import { EllipsisIcon, ListChecksIcon, PauseIcon, PlayIcon, TrashIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from "react";

const MonitorsPage = () => {

  const { user } = useAppStore()
  const router = useRouter();
  const { monitors, fetchMonitors, pauseMonitor, startMonitor, deleteMonitor } = useAppStore()
  const hasFetched = useRef(false);


  useEffect(() => {
    if(!hasFetched.current) {
      fetchMonitors();
      hasFetched.current = true;
    }
  }, [])

  const handleMonitorClick = (monitorId: string) => {
    router.push(`/monitors/${monitorId}`);
    console.log('Navigate to monitor detail page with id:', monitorId);
  }

  const handleCreateMonitor = () => {
    router.push('/monitors/create');
  }

  return (
    <ContentLayout title="Monitors">
      <div className="">
        <div className="flex flex-col sm:flex-row justify-between">
          <h1 className="text-2xl sm:text-xl mb-2">Hello, {user?.username}</h1>
          <Button className="" onClick={handleCreateMonitor}>Create monitor</Button>
        </div>
        <div className="mt-10 h-2/4">
          {monitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-2/4">
              <p className="text-lg font-medium text-center">You don't have any monitors yet.</p>
            </div>
          ) : (
            <ScrollArea className="h-screen">
              {monitors.map((monitor) =>
                <div key={monitor.id} className="flex flex-col mb-3">
                  <div className="flex items-center justify-between gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
                    onClick={() => handleMonitorClick(monitor.id)}
                  >
                    <div className="flex items-center gap-2 w-2/6">
                      <Circles isPaused={monitor.status === 'PAUSED' ? true : false} />
                      <div>
                        <p className="text-sm font-medium">{monitor.url}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          <span className={monitor.status === 'PAUSED' ? 'text-yellow-500 font-medium' : 'text-green-500 font-medium'}>{monitor.status}</span> • {formatDateDifference(monitor.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="w-2/6 hidden lg:flex items-center justify-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex items-center justify-center gap-2">
                              <ListChecksIcon className="h-5=4 w-4" />
                              <p className="text-sm font-medium">{monitor.frequency}</p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Checked every {monitor.frequency} seconds</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="text-xs font-medium w-2/6 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost'>
                            <EllipsisIcon className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent className="w-36" align="end" forceMount>
                          <DropdownMenuGroup>
                            <DropdownMenuItem className="hover:cursor-pointer" asChild>
                              {monitor.status === 'PAUSED' ? (
                                <div className="flex items-center" onClick={(e) => { e.stopPropagation(); startMonitor(monitor.id); }}>
                                  <PlayIcon className="h-3 w-3 mr-1" />
                                  Start
                                </div>
                              ) : (

                                <div className="flex items-center" onClick={(e) => { e.stopPropagation(); pauseMonitor(monitor.id); }}>
                                  <PauseIcon className="h-3 w-3 mr-1" />
                                  Pause
                                </div>
                              )
                              }
                            </DropdownMenuItem>
                            < DropdownMenuSeparator />
                            <DropdownMenuItem className="hover:cursor-pointer" asChild>
                              <div className="flex items-center" onClick={(e) => { e.stopPropagation(); deleteMonitor(monitor.id); }}>
                                <TrashIcon className="h-3 w-3 mr-1" />
                                Delete
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          )}
        </div>
      </div>
    </ContentLayout>
  );
};

export default MonitorsPage;