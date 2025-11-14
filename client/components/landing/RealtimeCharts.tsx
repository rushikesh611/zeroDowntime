import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "../ui/card";

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

export function RealtimeCharts() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [latencyData, setLatencyData] = useState(generateLatencyData());
    const [checksData, setChecksData] = useState(generateChecksData());
    const [regionData] = useState(generateRegionData());

    function generateLatencyData() {
        return Array.from({ length: 20 }, (_, i) => ({
            time: `${i}s`,
            latency: Math.floor(Math.random() * 150 + 50),
        }));
    }

    function generateChecksData() {
        return Array.from({ length: 12 }, (_, i) => ({
            hour: `${i * 2}h`,
            checks: Math.floor(Math.random() * 500 + 200),
        }));
    }

    function generateRegionData() {
        return [
            { region: "US East", latency: 45, checks: 1250 },
            { region: "EU West", latency: 23, checks: 980 },
            { region: "Asia Pacific", latency: 89, checks: 1120 },
            { region: "US West", latency: 67, checks: 890 },
            { region: "South America", latency: 112, checks: 450 },
        ];
    }

    useEffect(() => {
        if (containerRef.current) {
            gsap.fromTo(
                containerRef.current.querySelectorAll('.chart-card'),
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.2,
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top 80%",
                    }
                }
            );
        }

        // Simulate real-time updates
        const interval = setInterval(() => {
            setLatencyData(prev => {
                const newData = [...prev.slice(1)];
                newData.push({
                    time: `${prev.length}s`,
                    latency: Math.floor(Math.random() * 150 + 50),
                });
                return newData;
            });

            setChecksData(prev => {
                const updated = [...prev];
                const randomIndex = Math.floor(Math.random() * updated.length);
                updated[randomIndex] = {
                    ...updated[randomIndex],
                    checks: Math.floor(Math.random() * 500 + 200),
                };
                return updated;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const avgLatency = Math.round(latencyData.reduce((acc, d) => acc + d.latency, 0) / latencyData.length);
    const totalChecks = checksData.reduce((acc, d) => acc + d.checks, 0);
    const latencyTrend = latencyData[latencyData.length - 1].latency < latencyData[0].latency;

    return (
        <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gray-50" ref={containerRef}>
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-gray-900 mb-4">
                        Real-Time Performance Insights
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Monitor latency and check frequency across all regions with live data visualization
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Stats Cards */}
                    <Card className="chart-card p-6 border-2 border-gray-200 bg-white">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Average Latency</p>
                                <p className="text-3xl text-gray-900">{avgLatency}ms</p>
                            </div>
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${latencyTrend ? 'bg-black' : 'bg-gray-200'
                                }`}>
                                {latencyTrend ? (
                                    <TrendingDown className="w-5 h-5 text-white" />
                                ) : (
                                    <TrendingUp className="w-5 h-5 text-gray-600" />
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                            <span className="text-xs text-gray-500">Live monitoring</span>
                        </div>
                    </Card>

                    <Card className="chart-card p-6 border-2 border-gray-200 bg-white">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Checks (24h)</p>
                                <p className="text-3xl text-gray-900">{totalChecks.toLocaleString()}</p>
                            </div>
                            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">Across all monitoring types</p>
                    </Card>

                    <Card className="chart-card p-6 border-2 border-gray-200 bg-white">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Active Regions</p>
                                <p className="text-3xl text-gray-900">{regionData.length}</p>
                            </div>
                            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                                <span className="text-white">🌍</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">Global coverage</p>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Latency Chart */}
                    <Card className="chart-card p-6 border-2 border-gray-200 bg-white">
                        <h3 className="text-gray-900 mb-6">Latency Over Time</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={latencyData}>
                                <defs>
                                    <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#000" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#000" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="time"
                                    stroke="#9ca3af"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    unit="ms"
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: '#000',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '12px'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="latency"
                                    stroke="#000"
                                    strokeWidth={2}
                                    fill="url(#latencyGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Checks Chart */}
                    <Card className="chart-card p-6 border-2 border-gray-200 bg-white">
                        <h3 className="text-gray-900 mb-6">Checks Per Region</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={regionData}>
                                <XAxis
                                    dataKey="region"
                                    stroke="#9ca3af"
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    angle={-15}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis
                                    stroke="#9ca3af"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: '#000',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '12px'
                                    }}
                                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                                />
                                <Bar dataKey="checks" fill="#000" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </div>

                {/* Region Details */}
                <Card className="chart-card mt-6 p-6 border-2 border-gray-200 bg-white">
                    <h3 className="text-gray-900 mb-6">Regional Performance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {regionData.map((region) => (
                            <div key={region.region} className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">{region.region}</p>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-xl text-gray-900">{region.latency}ms</span>
                                </div>
                                <p className="text-xs text-gray-500">{region.checks} checks</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </section>
    );
}
