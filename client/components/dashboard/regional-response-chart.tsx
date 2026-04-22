import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonitorLog } from "@/types";
import { Timer, Zap } from 'lucide-react';
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

interface RegionalResponseChartProps {
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

const RegionalResponseChart: React.FC<RegionalResponseChartProps> = ({ data = [] }) => {
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
        const cutoff = new Date(currentTime.getTime() - (hoursAgo * 60 * 60 * 1000));

        const filteredData = data.filter(item => {
            const itemDate = new Date(item.lastCheckedAt);
            return itemDate >= cutoff && itemDate <= currentTime;
        });

        const sortedData = filteredData.sort((a, b) =>
            new Date(a.lastCheckedAt).getTime() - new Date(b.lastCheckedAt).getTime()
        );

        // Group by timestamp
        const dataByTimestamp: Record<number, ProcessedDataPoint> = {};

        sortedData.forEach(item => {
            const timestamp = new Date(item.lastCheckedAt).getTime();

            if (!dataByTimestamp[timestamp]) {
                dataByTimestamp[timestamp] = { timestamp } as ProcessedDataPoint;
                regions.forEach(r => dataByTimestamp[timestamp][r] = null);
            }

            dataByTimestamp[timestamp][item.region] = item.responseTime;
        });

        const timeseriesData = Object.values(dataByTimestamp).sort((a, b) => a.timestamp - b.timestamp);

        // Add current time point to extend chart to the right
        if (timeseriesData.length > 0 && timeseriesData[timeseriesData.length - 1].timestamp < currentTime.getTime()) {
            const lastPoint = { timestamp: currentTime.getTime() } as ProcessedDataPoint;
            regions.forEach(r => lastPoint[r] = null);
            timeseriesData.push(lastPoint);
        }

        return timeseriesData;
    }, [data, selectedRange, currentTime, regions]);

    const avgResponseTime = useMemo(() => {
        if (!data.length) return 0;
        let totalTime = 0;
        let count = 0;
        data.forEach(log => {
            if (log.responseTime) {
                totalTime += log.responseTime;
                count++;
            }
        });
        return count > 0 ? Math.round(totalTime / count) : 0;
    }, [data]);

    const formatXAxis = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                                    <span className="font-semibold tabular-nums">
                                        {entry.value}ms
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
                    <Timer className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-on-surface">No response data yet</p>
                <p className="text-xs text-on-surface-variant mt-1 font-medium">Response times will appear once monitoring begins</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-bold text-primary tabular-nums">{avgResponseTime}ms</span>
                    <span className="text-on-surface-variant font-medium">average response time</span>
                </div>
                <Select
                    value={selectedRange}
                    onValueChange={(value: TimeRange) => setSelectedRange(value)}
                >
                    <SelectTrigger className="w-full sm:w-28 h-9 bg-surface-container border-none rounded-xl font-semibold">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-xl">
                        {Object.entries(timeRanges).map(([value, label]) => (
                            <SelectItem key={value} value={value} className="rounded-xl">
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
                                interval="preserveStartEnd"
                                stroke="hsl(var(--muted-foreground))"
                                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                tickLine={false}
                                axisLine={{ stroke: "hsl(var(--border))" }}
                            />
                            <YAxis
                                label={{
                                    value: 'ms',
                                    angle: 0,
                                    position: 'insideTopLeft',
                                    offset: 10,
                                    style: { 
                                        fill: "hsl(var(--muted-foreground))",
                                        fontSize: 11,
                                        fontWeight: 500
                                    }
                                }}
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
                                    type="monotone"
                                    dataKey={region}
                                    name={region}
                                    stroke={regionColors[region]}
                                    dot={false}
                                    activeDot={{ 
                                        r: 5, 
                                        strokeWidth: 2,
                                        className: "animate-pulse"
                                    }}
                                    connectNulls={true}
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

export default RegionalResponseChart;