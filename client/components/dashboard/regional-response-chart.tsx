import { MonitorLog } from "@/app/(dashboard)/monitors/[id]/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface CustomTooltipProps extends TooltipProps<any, any> {
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
        "1h": "Last 1 Hour",
        "6h": "Last 6 Hours",
        "24h": "Last 24 Hours"
    };

    const [selectedRange, setSelectedRange] = useState<TimeRange>("1h");
    const [currentTime, setCurrentTime] = useState<Date>(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const regionColors: RegionColors = {
        'us-east-1': '#8884d8',
        'eu-west-1': '#82ca9d',
        'ap-south-1': '#ffc658'
    };

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

        const timeseriesData: ProcessedDataPoint[] = [];
        const seenTimestamps = new Set<number>();

        sortedData.forEach(item => {
            const timestamp = new Date(item.lastCheckedAt).getTime();

            if (!seenTimestamps.has(timestamp)) {
                const dataPoint: ProcessedDataPoint = {
                    timestamp,
                    'us-east-1': null,
                    'eu-west-1': null,
                    'ap-south-1': null
                };
                timeseriesData.push(dataPoint);
                seenTimestamps.add(timestamp);
            }

            const dataPoint = timeseriesData.find(d => d.timestamp === timestamp);
            if (dataPoint && Object.hasOwn(dataPoint, item.region)) {
                dataPoint[item.region] = item.responseTime;
            }
        });

        if (!seenTimestamps.has(currentTime.getTime())) {
            timeseriesData.push({
                timestamp: currentTime.getTime(),
                'us-east-1': null,
                'eu-west-1': null,
                'ap-south-1': null
            });
        }

        return timeseriesData;
    }, [data, selectedRange, currentTime]);

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
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="text-sm font-medium text-foreground">
                        {label ? new Date(label).toLocaleString() : ''}
                    </div>
                    {payload.map((entry, index) => (
                        entry.value !== null && (
                            <div key={index} className="text-sm">
                                <span style={{ color: entry.color }}>{entry.name}</span>: {entry.value}ms
                            </div>
                        )
                    ))}
                </div>
            );
        }
        return null;
    };

    if (!Array.isArray(data) || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Response Time by Region</CardTitle>
                </CardHeader>
                <CardContent className="h-96 flex items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Response Time by Region</CardTitle>
                <Select
                    value={selectedRange}
                    onValueChange={(value: TimeRange) => setSelectedRange(value)}
                >
                    <SelectTrigger className="w-36">
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
            </CardHeader>
            <CardContent>
                <div className="h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={processedData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                className="stroke-muted"
                                opacity={0.4}
                            />
                            <XAxis
                                dataKey="timestamp"
                                type="number"
                                scale="time"
                                domain={xAxisDomain}
                                tickFormatter={formatXAxis}
                                interval="preserveStartEnd"
                                stroke="hsl(var(--muted-foreground))"
                                tick={{ fill: "hsl(var(--muted-foreground))" }}
                            />
                            <YAxis
                                label={{
                                    value: 'Response Time (ms)',
                                    angle: -90,
                                    position: 'insideLeft',
                                    style: { fill: "hsl(var(--muted-foreground))" }
                                }}
                                stroke="hsl(var(--muted-foreground))"
                                tick={{ fill: "hsl(var(--muted-foreground))" }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{
                                    paddingTop: "20px",
                                }}
                            />
                            {Object.keys(regionColors).map((region) => (
                                <Line
                                    key={region}
                                    type="monotone"
                                    dataKey={region}
                                    name={region}
                                    stroke={regionColors[region]}
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                    connectNulls={true}
                                    strokeWidth={2}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default RegionalResponseChart;