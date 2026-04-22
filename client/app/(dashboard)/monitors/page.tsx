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
import { formatDateDifference } from "@/lib/utils";
import { useAppStore } from '@/store/useAppStore';
import {
  Activity,
  EllipsisIcon,
  MonitorIcon,
  PauseIcon,
  PlayIcon,
  Plus,
  TrashIcon,
  Wifi,
  WifiOff
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

  const activeCount = monitors.filter(m => m.status === 'RUNNING').length;
  const pausedCount = monitors.filter(m => m.status === 'PAUSED').length;

  return (
    <ContentLayout>
      <div className="space-y-5 animate-in fade-in-50 duration-500">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight text-on-surface">
              Monitors
            </h1>
            <p className="text-on-surface-variant text-sm">
              Create and manage your synthetic monitors.
            </p>
          </div>
          <button
            onClick={handleCreateMonitor}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-br from-primary to-primary-container text-white font-semibold text-sm shadow-md shadow-primary/15 hover:scale-[0.98] active:scale-95 transition-all duration-200"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Monitor
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 md:grid-cols-3">
          {/* Total */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Total Monitors</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <div className="text-2xl font-bold text-on-surface tracking-tight">{monitors.length}</div>
            <p className="text-[11px] text-on-surface-variant mt-0.5">All configured monitors</p>
          </div>

          {/* Active */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Active</span>
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Wifi className="h-3.5 w-3.5 text-secondary" />
              </div>
            </div>
            <div className="text-2xl font-bold text-secondary tracking-tight">{activeCount}</div>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Currently running</p>
          </div>

          {/* Paused */}
          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Paused</span>
              <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center">
                <WifiOff className="h-3.5 w-3.5 text-tertiary" />
              </div>
            </div>
            <div className="text-2xl font-bold text-tertiary tracking-tight">{pausedCount}</div>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Currently paused</p>
          </div>
        </div>

        {/* Monitors List */}
        <div className="bg-surface-container rounded-xl p-1.5">
          {monitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <MonitorIcon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-on-surface mb-1.5">No monitors yet</h3>
              <p className="text-sm text-on-surface-variant mb-6 max-w-sm leading-relaxed">
                Get started by creating your first monitor to track your APIs, websites, and services.
              </p>
              <button
                onClick={handleCreateMonitor}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-br from-primary to-primary-container text-white font-semibold text-sm shadow-md shadow-primary/15 hover:scale-[0.98] transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Monitor
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Table Header - Hidden on small screens */}
              <div className="hidden md:grid grid-cols-12 px-4 py-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-widest border-b border-surface-container-high/30">
                <div className="col-span-5">Monitor</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Frequency</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>
              {/* Rows */}
              {monitors.map((monitor) => (
                <div
                  key={monitor.id}
                  onClick={() => handleMonitorClick(monitor.id)}
                  className="flex flex-col md:grid md:grid-cols-12 items-start md:items-center px-4 py-4 md:py-3 bg-surface-container-lowest rounded-2xl md:rounded-xl cursor-pointer hover:bg-white hover:shadow-sm transition-all duration-150 group gap-3 md:gap-0"
                >
                  {/* Name & Type (Mobile only) */}
                  <div className="col-span-5 flex items-center gap-3 min-w-0 w-full">
                    <div className="relative shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${monitor.status === 'RUNNING' ? 'bg-secondary' : 'bg-tertiary'}`} />
                      {monitor.status === 'RUNNING' && (
                        <div className="absolute inset-0 rounded-full bg-secondary animate-ping opacity-50" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-on-surface truncate">
                          {monitor.name || monitor.url || `${monitor.host}:${monitor.port}`}
                        </p>
                        <span className="md:hidden inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider">
                          {monitor.url ? 'HTTP' : 'TCP'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <p className="text-xs text-on-surface-variant truncate opacity-80">
                          {monitor.name ? (monitor.url || `${monitor.host}:${monitor.port}`) : (monitor.url ? 'HTTP Monitor' : 'TCP Monitor')}
                        </p>
                        {monitor.role !== 'OWNER' && monitor.ownerName && (
                          <span className="text-[9px] bg-primary/10 px-1.5 py-0.5 rounded-md text-primary font-bold">
                            {monitor.ownerName}'s
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Mobile Status - shown on right side on mobile */}
                    <div className="md:hidden shrink-0">
                        {monitor.status === 'RUNNING' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold">
                            UP
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary text-[10px] font-bold">
                            PAUSED
                          </span>
                        )}
                    </div>
                  </div>

                  {/* Status (Desktop only) */}
                  <div className="hidden md:block col-span-2">
                    {monitor.status === 'RUNNING' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        Running
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tertiary/10 text-tertiary text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                        Paused
                      </span>
                    )}
                  </div>

                  {/* Type (Desktop only) */}
                  <div className="hidden md:block col-span-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                      {monitor.url ? 'HTTP' : 'TCP'}
                    </span>
                  </div>

                  {/* Frequency (Desktop only) */}
                  <div className="hidden md:block col-span-2">
                    <span className="text-xs text-on-surface-variant font-semibold">Every {monitor.frequency}s</span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex justify-end w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-none border-surface-container-high/30">
                    {monitor.role === 'READ' ? (
                      <div className="w-8 h-8 flex items-center justify-center text-on-surface-variant/30" title="Read-only access">
                        <EllipsisIcon className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        {/* Mobile quick actions */}
                        <div className="flex md:hidden items-center gap-1.5 flex-1">
                             <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    monitor.status === 'PAUSED' ? startMonitor(monitor.id) : pauseMonitor(monitor.id);
                                }}
                                className={`flex-1 h-8 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold transition-colors ${
                                    monitor.status === 'PAUSED' ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'
                                }`}
                             >
                                {monitor.status === 'PAUSED' ? <PlayIcon className="h-3 w-3" /> : <PauseIcon className="h-3 w-3" />}
                                {monitor.status === 'PAUSED' ? 'Start' : 'Pause'}
                             </button>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="w-8 h-8 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors md:opacity-0 group-hover:opacity-100 bg-surface-container/50 md:bg-transparent">
                                <EllipsisIcon className="h-4 w-4" />
                            </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[180px] rounded-2xl border-none shadow-2xl p-1.5">
                            <DropdownMenuGroup>
                                <DropdownMenuItem
                                className="rounded-xl text-sm font-semibold cursor-pointer py-2.5 px-3 focus:bg-primary/5"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    monitor.status === 'PAUSED'
                                    ? startMonitor(monitor.id)
                                    : pauseMonitor(monitor.id);
                                }}
                                >
                                {monitor.status === 'PAUSED' ? (
                                    <>
                                    <PlayIcon className="h-4 w-4 mr-2.5 text-secondary" />
                                    <span>Start Monitor</span>
                                    </>
                                ) : (
                                    <>
                                    <PauseIcon className="h-4 w-4 mr-2.5 text-tertiary" />
                                    <span>Pause Monitor</span>
                                    </>
                                )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-surface-container-high/50 mx-1 my-1" />
                                <DropdownMenuItem
                                className="rounded-xl text-sm font-semibold cursor-pointer text-error focus:text-error focus:bg-error/5 py-2.5 px-3"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteMonitor(monitor.id);
                                }}
                                >
                                <TrashIcon className="h-4 w-4 mr-2.5" />
                                Delete Monitor
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ContentLayout>
  );
};

export default MonitorsPage;