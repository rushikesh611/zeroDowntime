'use client'

import { ContentLayout } from "@/components/dashboard/content-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateDifference } from "@/lib/utils";
import { useAppStore } from '@/store/useAppStore';
import {
  Activity,
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
      <div className="space-y-8 animate-in fade-in-50 duration-500">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Monitors
            </h1>
            <p className="text-muted-foreground">
              Manage and track your uptime monitors.
            </p>
          </div>
          <Button
            onClick={handleCreateMonitor}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Monitor
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Monitors
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monitors.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active
              </CardTitle>
              <PlayIcon className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {monitors.filter(m => m.status === 'RUNNING').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Paused
              </CardTitle>
              <PauseIcon className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {monitors.filter(m => m.status === 'PAUSED').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monitors Table */}
        <div className="rounded-md border bg-card">
          {monitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <MonitorIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No monitors yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Get started by creation your first monitor.
              </p>
              <Button onClick={handleCreateMonitor} variant="outline">
                Create Monitor
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monitors.map((monitor) => (
                  <TableRow
                    key={monitor.id}
                    className="cursor-pointer group"
                    onClick={() => handleMonitorClick(monitor.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${monitor.status === 'RUNNING' ? 'bg-green-500' : 'bg-yellow-500'
                          }`} />
                        <span className="truncate max-w-[250px]" title={monitor.url || monitor.host + ":" + monitor.port}>
                          {monitor.url || monitor.host + ":" + monitor.port}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={monitor.status === 'PAUSED' ? 'secondary' : 'default'}
                        className={monitor.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : 'bg-green-100 text-green-800 hover:bg-green-100'}
                      >
                        {monitor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {monitor.frequency}s
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateDifference(monitor.createdAt)} ago
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0"
                          >
                            <EllipsisIcon className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                                  <PlayIcon className="h-4 w-4 mr-2" />
                                  Start
                                </>
                              ) : (
                                <>
                                  <PauseIcon className="h-4 w-4 mr-2" />
                                  Pause
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
                              <TrashIcon className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
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