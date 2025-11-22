'use client'

import Circles from "@/components/circles";
import { ContentLayout } from "@/components/dashboard/content-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Activity,
  Clock,
  EllipsisIcon,
  MonitorIcon,
  PauseIcon,
  PlayIcon,
  Plus,
  TrashIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from "react";

const MonitorsPage = () => {

  const { user } = useAppStore()
  const router = useRouter();
  const { monitors, fetchMonitors, pauseMonitor, startMonitor, deleteMonitor } = useAppStore()
  const hasFetched = useRef(false);


  useEffect(() => {
    if (!hasFetched.current) {
      fetchMonitors();
      hasFetched.current = true;
    }
  }, [fetchMonitors]);

  const handleMonitorClick = (monitorId: string) => {
    router.push(`/monitors/${monitorId}`);
  }

  const handleCreateMonitor = () => {
    router.push('/monitors/create');
  }

  return (
    <ContentLayout>
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.username}
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor and manage your website uptime
            </p>
          </div>
          <Button
            onClick={handleCreateMonitor}
            size="lg"
            className="w-full sm:w-auto shadow-sm hover:shadow-md transition-shadow rounded-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Monitor
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Monitors</p>
                  <p className="text-2xl font-bold">{monitors.length}</p>
                </div>
                <div className="rounded-full bg-primary/10 p-3">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {monitors.filter(m => m.status === 'RUNNING').length}
                  </p>
                </div>
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                  <PlayIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Paused</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {monitors.filter(m => m.status === 'PAUSED').length}
                  </p>
                </div>
                <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/20 p-3">
                  <PauseIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monitors List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Monitors</h2>
          </div>

          {monitors.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <MonitorIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No monitors yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Get started by creating your first monitor to track website uptime and performance.
                </p>
                <Button onClick={handleCreateMonitor}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Monitor
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[calc(100vh-28rem)]">
              <div className="space-y-3 pr-4">
                {monitors.map((monitor, index) => (
                  <Card
                    key={monitor.id}
                    className="border-none shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group animate-in fade-in-50 slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => handleMonitorClick(monitor.id)}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Left Section - Monitor Info */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 mt-0.5">
                            <Circles isPaused={monitor.status === 'PAUSED'} />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-sm sm:text-base font-semibold truncate group-hover:text-primary transition-colors">
                              {monitor.url}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className={`font-medium px-2 py-0.5 rounded-full ${monitor.status === 'PAUSED'
                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                }`}>
                                {monitor.status}
                              </span>
                              <span>•</span>
                              <span>{formatDateDifference(monitor.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Middle Section - Frequency (Hidden on mobile) */}
                        <div className="hidden lg:flex items-center justify-center px-4">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">{monitor.frequency}s</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Checked every {monitor.frequency} seconds</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {/* Right Section - Actions */}
                        <div className="flex items-center justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-muted"
                              >
                                <EllipsisIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent className="w-40" align="end">
                              <DropdownMenuGroup>
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    monitor.status === 'PAUSED'
                                      ? startMonitor(monitor.id)
                                      : pauseMonitor(monitor.id);
                                  }}
                                >
                                  {monitor.status === 'PAUSED' ? (
                                    <>
                                      <PlayIcon className="h-4 w-4 mr-2" />
                                      Start Monitor
                                    </>
                                  ) : (
                                    <>
                                      <PauseIcon className="h-4 w-4 mr-2" />
                                      Pause Monitor
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteMonitor(monitor.id);
                                  }}
                                >
                                  <TrashIcon className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Mobile Frequency Display */}
                      <div className="flex lg:hidden mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Checks every {monitor.frequency} seconds</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </ContentLayout>
  );
};

export default MonitorsPage;