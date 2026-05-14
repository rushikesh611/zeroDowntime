'use client'

import { ContentLayout } from "@/components/dashboard/content-layout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppStore } from '@/store/useAppStore';
import {
  Activity,
  EllipsisVertical,
  MonitorIcon,
  PauseIcon,
  PlayIcon,
  Plus,
  TrashIcon,
  Wifi,
  WifiOff,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const MonitorsPage = () => {
  const { user } = useAppStore()
  const router = useRouter();
  const { monitors, fetchMonitors, pauseMonitor, startMonitor, deleteMonitor } = useAppStore()
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchMonitors().finally(() => setIsLoading(false));
    }
  }, [fetchMonitors]);

  const handleMonitorClick = (monitorId: string) => {
    router.push(`/monitors/${monitorId}`);
  }

  const handleCreateMonitor = () => {
    router.push('/monitors/create');
  }

  const activeCount = monitors.filter(m => m.status === 'RUNNING').length;
  const pausedCount = monitors.filter(m => m.status === 'PAUSED').length;

  return (
    <ContentLayout>
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              Monitors
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage and track the status of your services.
            </p>
          </div>
          <Button onClick={handleCreateMonitor} className="rounded-md shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Monitor
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-none border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground opacity-50" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monitors.length}</div>
            </CardContent>
          </Card>
          <Card className="shadow-none border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active</CardTitle>
              <Wifi className="h-4 w-4 text-emerald-500 opacity-50" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
            </CardContent>
          </Card>
          <Card className="shadow-none border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Paused</CardTitle>
              <WifiOff className="h-4 w-4 text-amber-500 opacity-50" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{pausedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Monitors List */}
        <div className="border rounded-md bg-card overflow-hidden">
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="py-3 font-semibold text-foreground">Monitor</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Status</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Type</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Frequency</TableHead>
                  <TableHead className="py-3 text-right font-semibold text-foreground pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-2 w-2 rounded-full" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-3 w-52" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-12 rounded-md" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-10 rounded" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : monitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <MonitorIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1 text-foreground">No monitors yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Start monitoring your infrastructure by creating your first monitor.
              </p>
              <Button onClick={handleCreateMonitor} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Monitor
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead className="py-3 font-semibold text-foreground">Monitor</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Status</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Type</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground">Frequency</TableHead>
                  <TableHead className="py-3 text-right font-semibold text-foreground pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monitors.map((monitor) => (
                  <TableRow 
                    key={monitor.id} 
                    className="group cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => handleMonitorClick(monitor.id)}
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                         <div className={`w-2 h-2 rounded-full ${monitor.status === 'RUNNING' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                         <div className="flex flex-col min-w-0">
                           <span className="truncate text-sm font-medium text-foreground">
                             {monitor.name || monitor.url || `${monitor.host}:${monitor.port}`}
                           </span>
                           <span className="truncate text-[11px] text-muted-foreground font-normal">
                             {monitor.url || `${monitor.host}:${monitor.port}`}
                           </span>
                         </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          monitor.status === 'RUNNING' 
                          ? 'bg-emerald-100/50 text-emerald-700 hover:bg-emerald-100/50' 
                          : 'bg-amber-100/50 text-amber-700 hover:bg-amber-100/50'
                        }`}
                      >
                        {monitor.status === 'RUNNING' ? 'UP' : 'PAUSED'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50">
                        {monitor.url ? 'HTTP' : 'TCP'}
                      </span>
                    </TableCell>
                    <TableCell className="text-[11px] text-muted-foreground">
                      Every {monitor.frequency}s
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end">
                        {monitor.role !== 'READ' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <EllipsisVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuGroup>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    monitor.status === 'PAUSED'
                                      ? startMonitor(monitor.id)
                                      : pauseMonitor(monitor.id);
                                  }}
                                >
                                  {monitor.status === 'PAUSED' ? (
                                    <>
                                      <PlayIcon className="h-3.5 w-3.5 mr-2 text-emerald-500" />
                                      <span>Start</span>
                                    </>
                                  ) : (
                                    <>
                                      <PauseIcon className="h-3.5 w-3.5 mr-2 text-amber-500" />
                                      <span>Pause</span>
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteMonitor(monitor.id);
                                  }}
                                >
                                  <TrashIcon className="h-3.5 w-3.5 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors ml-2" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </ContentLayout>
  );
};

export default MonitorsPage;