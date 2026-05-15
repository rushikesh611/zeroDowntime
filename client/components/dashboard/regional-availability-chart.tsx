import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonitorLog } from "@/types";
import { Activity, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    TooltipProps,
    XAxis,
    YAxis,
} from 'recharts';

type TimeRange = "1h" | "6h" | "24h";

type RegionColors = {
    [key: string]: string;
};

type TimeRanges = {
    [K in TimeRange]: string;
};

type ProcessedDataPoint = {
    timestamp: number;
    'us-east-1': number | null;
    'eu-west-1': number | null;
    'ap-south-1': number | null;
    [key: string]: number | null;
};

interface RegionalAvailabilityChartProps {
    data?: MonitorLog[];
}

interface CustomTooltipProps extends TooltipProps<number, string> {
    active?: boolean;
    payload?: Array<{
        value: number;
        name: string;
        color: string;
    }>;
    label?: string;
}

const RegionalAvailabilityChart: React.FC<RegionalAvailabilityChartProps> = ({ data = [] }) => {
    const timeRanges: TimeRanges = {
        "1h": "1H",
        "6h": "6H",
        "24h": "24H"
    };

    const [selectedRange, setSelectedRange] = useState<TimeRange>("1h");
    const [currentTime, setCurrentTime] = useState<Date>(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const regions = useMemo(() => {
        const uniqueRegions = new Set<string>();
        data.forEach(log => uniqueRegions.add(log.region));
        return Array.from(uniqueRegions);
    }, [data]);

    const regionColors = useMemo((): RegionColors => {
        const colors = [
            'hsl(var(--chart-1))',
            'hsl(var(--chart-2))',
            'hsl(var(--chart-3))',
            'hsl(var(--chart-4))',
            'hsl(var(--chart-5))',
        ];
        const mapping: RegionColors = {};
        regions.forEach((region, i) => {
            mapping[region] = colors[i % colors.length];
        });
        return mapping;
    }, [regions]);

    const processedData = useMemo((): ProcessedDataPoint[] => {
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }

        const hoursAgo = parseInt(selectedRange);
        const cutoff = currentTime.getTime() - (hoursAgo * 60 * 60 * 1000);

        const filteredData = data.filter(item => {
            const itemDate = new Date(item.lastCheckedAt).getTime();
            return itemDate >= cutoff && itemDate <= currentTime.getTime();
        });

        const sortedData = filteredData.sort((a, b) =>
            new Date(a.lastCheckedAt).getTime() - new Date(b.lastCheckedAt).getTime()
        );

        // Map regions to points
        const GAP_THRESHOLD = 15 * 60 * 1000; // 15 minutes gap
        const result: ProcessedDataPoint[] = [];
        
        // Group by timestamp (roughly) to merge regional checks that happened at the same time
        const groupedByTime: Record<number, any> = {};
        
        sortedData.forEach(item => {
            // Use 5-second resolution to avoid losing data while still grouping near-simultaneous checks
            const ts = Math.floor(new Date(item.lastCheckedAt).getTime() / 5000) * 5000;
            if (!groupedByTime[ts]) {
                groupedByTime[ts] = { timestamp: ts };
            }
            const isUp = item.status === 'UP' || item.isUp;
            groupedByTime[ts][item.region] = isUp ? 1 : 0;
        });

        const timestamps = Object.keys(groupedByTime).map(Number).sort((a, b) => a - b);
        
        for (let i = 0; i < timestamps.length; i++) {
            const currentTs = timestamps[i];
            
            // Insert nulls to show gaps if the jump is too big
            if (i > 0 && currentTs - timestamps[i-1] > GAP_THRESHOLD) {
                const gapPoint = { timestamp: timestamps[i-1] + 60000 } as ProcessedDataPoint;
                regions.forEach(r => gapPoint[r] = null);
                result.push(gapPoint);
            }
            
            result.push(groupedByTime[currentTs]);
        }

        return result;
    }, [data, selectedRange, currentTime, regions]);

    const uptime = useMemo(() => {
        if (!data.length) return 0;
        let totalChecks = data.length;
        let upChecks = data.filter(log => log.status === 'UP' || log.isUp).length;
        return totalChecks > 0 ? ((upChecks / totalChecks) * 100).toFixed(1) : 0;
    }, [data]);

    const formatXAxis = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatYAxis = (value: number): string => {
        return value === 1 ? 'Up' : 'Down';
    };

    const xAxisDomain = useMemo((): [number, number] => {
        const hoursAgo = parseInt(selectedRange);
        return [
            currentTime.getTime() - (hoursAgo * 60 * 60 * 1000),
            currentTime.getTime()
        ];
    }, [selectedRange, currentTime]);

    const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-3 shadow-lg animate-in fade-in-0 zoom-in-95">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                        {label ? new Date(label).toLocaleString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short'
                        }) : ''}
                    </div>
                    <div className="space-y-1">
                        {payload.map((entry, index) => (
                            entry.value !== null && (
                                <div key={index} className="flex items-center justify-between gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: entry.color }}
                                        />
                                        <span className="font-medium">{entry.name}</span>
                                    </div>
                                    <span className={entry.value === 1 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'}>
                                        {entry.value === 1 ? 'Up' : 'Down'}
                                    </span>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    if (!Array.isArray(data) || data.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Activity className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-on-surface">No availability data yet</p>
                <p className="text-xs text-on-surface-variant mt-1 font-medium">Data will appear once monitoring begins</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-secondary" />
                    <span className="font-bold text-secondary">{uptime}%</span>
                    <span className="text-on-surface-variant font-medium">uptime in selected period</span>
                </div>
                <Select
                    value={selectedRange}
                    onValueChange={(value: TimeRange) => setSelectedRange(value)}
                >
                    <SelectTrigger className="w-full sm:w-28 h-9">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(timeRanges).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <div className="h-64 sm:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={processedData}
                            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                className="stroke-muted"
                                opacity={0.3}
                                vertical={false}
                            />
                            <XAxis
                                dataKey="timestamp"
                                type="number"
                                scale="time"
                                domain={xAxisDomain}
                                tickFormatter={formatXAxis}
                                tickCount={6}
                                stroke="hsl(var(--muted-foreground))"
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                                tickLine={false}
                                axisLine={{ stroke: "hsl(var(--border))" }}
                            />
                            <YAxis
                                type="number"
                                domain={[0, 1]}
                                tickFormatter={formatYAxis}
                                ticks={[0, 1]}
                                stroke="hsl(var(--muted-foreground))"
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                tickLine={false}
                                axisLine={{ stroke: "hsl(var(--border))" }}
                                width={45}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, strokeDasharray: '3 3' }} />
                            <Legend
                                wrapperStyle={{
                                    paddingTop: "16px",
                                    fontSize: "13px"
                                }}
                                iconType="circle"
                                iconSize={8}
                            />
                            {Object.keys(regionColors).map((region) => (
                                <Line
                                    key={region}
                                    type="stepAfter"
                                    dataKey={region}
                                    name={region}
                                    stroke={regionColors[region]}
                                    dot={{ r: 3, strokeWidth: 1.5, fill: regionColors[region] }}
                                    activeDot={{
                                        r: 5,
                                        strokeWidth: 2,
                                        className: "animate-pulse"
                                    }}
                                    connectNulls={false}
                                    strokeWidth={2.5}
                                    className="transition-all duration-300"
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default RegionalAvailabilityChart;