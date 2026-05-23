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
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const MonitorsPage = () => {
  const router = useRouter();
  const { monitors, fetchMonitors, pauseMonitor, startMonitor, deleteMonitor } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchMonitors().finally(() => setIsLoading(false));
    }
  }, [fetchMonitors]);

  const handleMonitorClick = (monitorId: string) => {
    router.push(`/monitors/${monitorId}`);
  };

  const handleCreateMonitor = () => {
    router.push('/monitors/create');
  };

  const activeCount = monitors.filter(m => m.status === 'RUNNING').length;
  const pausedCount = monitors.filter(m => m.status === 'PAUSED').length;

  // Filter monitors based on search query
  const filteredMonitors = monitors.filter(monitor => {
    const name = monitor.name || '';
    const url = monitor.url || '';
    const host = monitor.host || '';
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || url.toLowerCase().includes(query) || host.toLowerCase().includes(query);
  });

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
          <div className="border border-border bg-card rounded-lg p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Total Monitors
              <Activity className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <div className="text-2xl font-bold text-foreground mt-3">{monitors.length}</div>
          </div>
          <div className="border border-border bg-card rounded-lg p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Active Monitors
              <Wifi className="h-4 w-4 text-emerald-500/50" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-3">{activeCount}</div>
          </div>
          <div className="border border-border bg-card rounded-lg p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Paused Monitors
              <WifiOff className="h-4 w-4 text-amber-500/50" />
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-3">{pausedCount}</div>
          </div>
        </div>

        {/* Search & Header Bar (Unified Notion style) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-muted/20 border-t border-x border-border/80 px-4 py-3 rounded-t-lg">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">My Monitors</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-semibold border border-emerald-500/20">
              {filteredMonitors.length} of {monitors.length} listed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search monitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 px-2 border rounded-md text-[10px] text-foreground bg-background w-48 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Monitors List Table Container */}
        <div className="border-b border-x border-border/80 rounded-b-lg bg-card overflow-hidden">
          {isLoading ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/10">
                  <TableHead className="py-3 font-semibold text-foreground text-xs">Monitor</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground text-xs">Type</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground text-xs">Uptime History (30d)</TableHead>
                  <TableHead className="py-3 text-right font-semibold text-foreground text-xs">Avg Latency</TableHead>
                  <TableHead className="py-3 text-right font-semibold text-foreground text-xs">SSL Cert</TableHead>
                  <TableHead className="py-3 text-right font-semibold text-foreground text-xs pr-6">Actions</TableHead>
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
                    <TableCell>
                      <div className="space-y-1.5 w-44">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-44 rounded-sm" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    <TableCell className="text-right pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : filteredMonitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <MonitorIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1 text-foreground">No monitors found</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {searchQuery ? "No monitors match your current search query." : "Start monitoring your infrastructure by creating your first monitor."}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateMonitor} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Monitor
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/10">
                  <TableHead className="py-3 font-semibold text-foreground text-xs">Monitor</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground text-xs">Type</TableHead>
                  <TableHead className="py-3 font-semibold text-foreground text-xs">Uptime History (24h)</TableHead>
                  <TableHead className="py-3 text-right font-semibold text-foreground text-xs pr-6">Avg Latency</TableHead>
                  <TableHead className="py-3 text-right font-semibold text-foreground text-xs pr-6">SSL Certificate</TableHead>
                  <TableHead className="py-3 text-right font-semibold text-foreground text-xs pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMonitors.map((monitor) => {
                  const isRunning = monitor.status === 'RUNNING';
                  const isHttps = monitor.url?.startsWith('https://');
                  const isMonitoringSsl = monitor.monitorType === 'ssl' || (isHttps ?? false);

                  // Compute real average latency
                  const latency = isRunning && monitor.avgLatency !== undefined && monitor.avgLatency !== null
                    ? `${monitor.avgLatency}ms`
                    : isRunning && monitor.avgLatency === undefined
                      ? 'Checking...'
                      : '—';

                  // Compute real SSL status
                  let sslStatus = '—';
                  let sslColorClass = 'text-muted-foreground';
                  
                  if (isMonitoringSsl) {
                    if (!isRunning) {
                      sslStatus = 'Paused';
                    } else if (monitor.sslDaysRemaining !== undefined && monitor.sslDaysRemaining !== null) {
                      const days = monitor.sslDaysRemaining;
                      if (days < 0) {
                        sslStatus = 'Expired';
                        sslColorClass = 'text-destructive font-bold';
                      } else if (days < 15) {
                        sslStatus = `Valid (${days}d left)`;
                        sslColorClass = 'text-amber-500 font-semibold';
                      } else {
                        sslStatus = `Valid (${days} days left)`;
                        sslColorClass = 'text-emerald-600 font-semibold';
                      }
                    } else {
                      sslStatus = 'Valid';
                      sslColorClass = 'text-emerald-600';
                    }
                  }

                  // Compute real 24h uptime percentage
                  const totalHoursWithData = monitor.uptimeHistory?.filter(h => h.hasData).length || 0;
                  const upHours = monitor.uptimeHistory?.filter(h => h.hasData && h.isUp).length || 0;
                  const uptimePct = totalHoursWithData > 0
                    ? `${((upHours / totalHoursWithData) * 100).toFixed(2)}%`
                    : (isRunning ? '100.0%' : '—');

                  return (
                    <TableRow 
                      key={monitor.id} 
                      className="group cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => handleMonitorClick(monitor.id)}
                    >
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-3">
                           <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                           <div className="flex flex-col min-w-0">
                             <span className="truncate text-sm font-semibold text-foreground">
                               {monitor.name || monitor.url || (monitor.port ? `${monitor.host}:${monitor.port}` : monitor.host)}
                             </span>
                             <span className="truncate text-[10px] text-muted-foreground font-normal">
                               {monitor.url || (monitor.port ? `${monitor.host}:${monitor.port}` : monitor.host)}
                             </span>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border/50 uppercase">
                          {monitor.monitorType ? monitor.monitorType.toUpperCase() : 'HTTP'}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex flex-col gap-1 w-44">
                          <div className="flex justify-between text-[9px] text-muted-foreground px-0.5">
                            <span>Uptime (24h)</span>
                            <span className="text-foreground font-semibold">{uptimePct}</span>
                          </div>
                          <div className="flex gap-[2px]">
                            {monitor.uptimeHistory && monitor.uptimeHistory.length === 24 ? (
                              monitor.uptimeHistory.map((h, i) => {
                                let barClass = 'bg-muted/40';
                                let title = 'No data / Paused';
                                if (isRunning) {
                                  if (h.hasData) {
                                    barClass = h.isUp ? 'bg-emerald-500' : 'bg-destructive animate-pulse';
                                    title = h.isUp ? 'Operational' : 'Downtime logged';
                                  }
                                }
                                return (
                                  <div
                                    key={i}
                                    className={`h-4 flex-grow rounded-sm ${barClass}`}
                                    title={title}
                                  ></div>
                                );
                              })
                            ) : (
                              Array.from({ length: 24 }).map((_, i) => {
                                const barClass = isRunning ? 'bg-emerald-500' : 'bg-muted/40';
                                return (
                                  <div
                                    key={i}
                                    className={`h-4 flex-grow rounded-sm ${barClass}`}
                                    title={isRunning ? 'Operational' : 'Paused'}
                                  ></div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 text-right pr-6">
                        <div className="text-right">
                          <p className="text-muted-foreground text-[9px]">Avg Latency</p>
                          <p className="font-semibold text-foreground text-xs tabular-nums">{latency}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 text-right pr-6">
                        <div className="text-right">
                          <p className="text-muted-foreground text-[9px]">SSL Certificate</p>
                          <p className={`font-semibold text-xs ${sslColorClass}`}>
                            {sslStatus}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end">
                          {monitor.role !== 'READ' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <EllipsisVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuGroup>
                                  <DropdownMenuItem
                                    onClick={() => {
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
                                    onClick={() => {
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
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </ContentLayout>
  );
};

export default MonitorsPage;