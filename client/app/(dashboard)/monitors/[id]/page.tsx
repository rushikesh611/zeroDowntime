"use client"

import { ContentLayout } from "@/components/dashboard/content-layout"
import { fetchWithAuth } from "@/lib/utils"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import RegionalAvailabilityChart from "@/components/dashboard/regional-availability-chart"
import RegionalResponseChart from "@/components/dashboard/regional-response-chart"
import { useAppStore } from "@/store/useAppStore"
import { Monitor, MonitorLog } from "@/types"
import { Activity, ArrowLeft, BellIcon, Clock, Globe, PauseIcon, PlayIcon, Settings, Shield, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

const MonitorDetailsPage = () => {
    const { id } = useParams() as { id: string }
    const [monitor, setMonitor] = useState<Monitor | null>(null)
    const [monitorLogs, setMonitorLogs] = useState<MonitorLog[]>([])
    const [stats, setStats] = useState<{ avg: number; p95: number; p99: number; count: number } | null>(null)
    const { pauseMonitor, startMonitor, fetchMonitorById } = useAppStore()
    const router = useRouter()
    const [isMonitorLoading, setIsMonitorLoading] = useState(true)
    const [isChartsLoading, setIsChartsLoading] = useState(true)

    useEffect(() => {
        setIsMonitorLoading(true)
        setIsChartsLoading(true)
        
        fetchMonitorById(id).then((monitor) => {
            if (monitor) setMonitor(monitor)
        }).finally(() => setIsMonitorLoading(false))

        const fetchData = async () => {
            try {
                const monitorLogs = await fetchWithAuth("/api/monitors/" + id + "/logs?aggregate=true&interval=15")
                if (monitorLogs.ok) {
                    const result = await monitorLogs.json()
                    setMonitorLogs(result)
                }
            } catch (error) {
                console.error("Error fetching data:", error)
            }
        }

        const fetchStats = async () => {
            try {
                const response = await fetchWithAuth(`/api/monitors/${id}/stats`)
                if (response.ok) {
                    const result = await response.json()
                    setStats(result)
                }
            } catch (error) {
                console.error("Error fetching stats:", error)
            }
        }

        Promise.all([fetchData(), fetchStats()]).finally(() => setIsChartsLoading(false))

        const intervalId = setInterval(() => {
            fetchData()
            fetchStats()
        }, 30000)

        return () => clearInterval(intervalId)
    }, [id, fetchMonitorById])

    const handleConfigure = (monitorId: string) => router.push(`/monitors/${monitorId}/update`)

    const isRunning = monitor?.status === "RUNNING"
    const avgResponseTime = stats?.avg || 0
    const p95 = stats?.p95 || 0
    const p99 = stats?.p99 || 0

    return (
        <ContentLayout>
            <div className="mx-auto max-w-5xl py-6 space-y-8 animate-in fade-in-50 duration-500">
                {/* Header / Back Navigation */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/monitors")}
                        className="-ml-2 h-8 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Monitors
                    </Button>
                    <div className="flex items-center gap-2">
                        {isMonitorLoading ? (
                            <div className="flex gap-2">
                                <Skeleton className="h-8 w-20" />
                                <Skeleton className="h-8 w-24" />
                            </div>
                        ) : monitor && monitor.role !== "READ" && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (!monitor) return
                                        isRunning
                                            ? pauseMonitor(monitor.id).then(() => setMonitor({ ...monitor, status: "PAUSED" }))
                                            : startMonitor(monitor.id).then(() => setMonitor({ ...monitor, status: "RUNNING" }))
                                    }}
                                    className="h-8 text-xs font-semibold"
                                >
                                    {isRunning ? <PauseIcon className="mr-2 h-3.5 w-3.5" /> : <PlayIcon className="mr-2 h-3.5 w-3.5" />}
                                    {isRunning ? "Pause" : "Start"}
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => monitor && handleConfigure(monitor.id)}
                                    className="h-8 text-xs font-semibold"
                                >
                                    <Settings className="mr-2 h-3.5 w-3.5" />
                                    Configure
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Hero Section */}
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-4">
                        {isMonitorLoading ? (
                            <div className="flex items-start gap-4">
                                <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-7 w-48" />
                                    <Skeleton className="h-4 w-64" />
                                    <div className="flex gap-2 mt-3">
                                        <Skeleton className="h-5 w-16" />
                                        <Skeleton className="h-5 w-12" />
                                        <Skeleton className="h-5 w-24" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-4">
                                <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${isRunning ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}`}>
                                    <Activity className="h-6 w-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-2xl font-semibold tracking-tight truncate">
                                        {monitor?.name || monitor?.url || `${monitor?.host}:${monitor?.port}`}
                                    </h1>
                                    <p className="text-sm text-muted-foreground truncate font-mono mt-0.5">
                                        {monitor?.url || `${monitor?.host}:${monitor?.port}`}
                                    </p>
                                    <div className="flex items-center gap-3 mt-3">
                                        <Badge variant={isRunning ? "secondary" : "outline"} className={`text-[10px] uppercase font-bold tracking-wider rounded-md h-5 ${isRunning ? 'bg-green-500/10 text-green-700 border-green-500/20' : ''}`}>
                                            <div className={`mr-1.5 h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-green-600 animate-pulse' : 'bg-muted-foreground'}`} />
                                            {monitor?.status || 'UNKNOWN'}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider rounded-md h-5">
                                            {monitor?.url ? 'HTTP' : 'TCP'}
                                        </Badge>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                            <Clock className="h-3.5 w-3.5" />
                                            Every {monitor?.frequency}s
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <Card className="shadow-none border h-full flex flex-col justify-center p-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                <BellIcon className="h-3.5 w-3.5" />
                                Alert Channel
                            </div>
                            {isMonitorLoading ? (
                                <div className="space-y-1.5">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                            ) : monitor?.notifier ? (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold">{monitor.notifier.name}</span>
                                        <Badge variant="outline" className="text-[8px] uppercase h-4 px-1">{monitor.notifier.type}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{monitor.notifier.details}</p>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground italic">No channel configured</p>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-3">
                    {isChartsLoading ? (
                        <>
                            {[1, 2, 3].map(i => (
                                <Card key={i} className="shadow-none border">
                                    <CardContent className="p-5 space-y-2">
                                        <Skeleton className="h-3 w-20" />
                                        <Skeleton className="h-8 w-24" />
                                    </CardContent>
                                </Card>
                            ))}
                        </>
                    ) : (
                        <>
                            <Card className="shadow-none border bg-muted/20">
                                <CardContent className="p-5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Avg Latency</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl font-semibold tracking-tight">{avgResponseTime}</span>
                                        <span className="text-xs text-muted-foreground font-medium">ms</span>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="shadow-none border">
                                <CardContent className="p-5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">p95 Latency</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl font-semibold tracking-tight text-blue-600">{p95}</span>
                                        <span className="text-xs text-muted-foreground font-medium">ms</span>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="shadow-none border">
                                <CardContent className="p-5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">p99 Latency</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl font-semibold tracking-tight text-purple-600">{p99}</span>
                                        <span className="text-xs text-muted-foreground font-medium">ms</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                {/* Charts Area */}
                <div className="grid gap-6">
                    <Card className="shadow-none border">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-yellow-500" />
                                        Regional Availability
                                    </CardTitle>
                                    <CardDescription className="text-xs">Uptime status across your configured regions.</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    {monitor?.regions?.map(r => (
                                        <Badge key={r} variant="outline" className="text-[9px] uppercase font-bold py-0 h-4">{r}</Badge>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isChartsLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-64 w-full rounded-md" />
                                </div>
                            ) : (
                                <RegionalAvailabilityChart data={monitorLogs} />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-none border">
                        <CardHeader className="pb-4">
                            <div className="space-y-1">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-blue-500" />
                                    Regional Response Times
                                </CardTitle>
                                <CardDescription className="text-xs">Average latency measured from different probe locations.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isChartsLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-64 w-full rounded-md" />
                                </div>
                            ) : (
                                <RegionalResponseChart data={monitorLogs} />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium px-1">
                    <div className="flex items-center gap-4">
                        <span>Monitor ID: {id}</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span>Created: {monitor?.createdAt ? new Date(monitor.createdAt).toLocaleDateString() : '–'}</span>
                    </div>
                    {monitor?.role === 'READ' && (
                        <div className="flex items-center gap-1.5 text-yellow-600">
                            <Shield className="h-3 w-3" />
                            Read-only View
                        </div>
                    )}
                </div>
            </div>
        </ContentLayout>
    )
}

export default MonitorDetailsPage