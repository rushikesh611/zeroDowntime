import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card } from "../ui/card";

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

export function StatusPageFeature() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedService, setSelectedService] = useState(0);

    const services = [
        { name: "API Gateway", status: "operational", uptime: "99.98%" },
        { name: "Web Application", status: "operational", uptime: "99.95%" },
        { name: "Database", status: "degraded", uptime: "99.12%" },
        { name: "Email Service", status: "operational", uptime: "99.99%" },
        { name: "Payment Processing", status: "operational", uptime: "100%" },
    ];

    const incidents = [
        {
            title: "Increased API Latency",
            status: "investigating",
            time: "2 min ago",
            updates: [
                { time: "2 min ago", message: "We are investigating reports of increased API response times." }
            ]
        },
        {
            title: "Database Performance Degradation",
            status: "monitoring",
            time: "15 min ago",
            updates: [
                { time: "15 min ago", message: "The issue has been identified and a fix is being deployed." },
                { time: "22 min ago", message: "We are seeing elevated query response times." }
            ]
        },
    ];

    useEffect(() => {
        if (containerRef.current) {
            gsap.fromTo(
                containerRef.current.querySelectorAll('.status-item'),
                { opacity: 0, x: -20 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.4,
                    stagger: 0.1,
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top 80%",
                    }
                }
            );
        }
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "operational":
                return <CheckCircle2 className="w-4 h-4 text-black" />;
            case "degraded":
                return <AlertTriangle className="w-4 h-4 text-gray-600" />;
            case "outage":
                return <XCircle className="w-4 h-4 text-gray-400" />;
            default:
                return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "operational":
                return "bg-black";
            case "degraded":
                return "bg-gray-400";
            case "outage":
                return "bg-gray-300";
            default:
                return "bg-gray-500";
        }
    };

    const getIncidentStatusColor = (status: string) => {
        switch (status) {
            case "investigating":
                return "bg-gray-600";
            case "monitoring":
                return "bg-gray-500";
            case "resolved":
                return "bg-black";
            default:
                return "bg-gray-400";
        }
    };

    return (
        <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-gray-900 mb-4">
                        Branded Status Pages & Incident Management
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Keep your users informed with beautiful status pages and manage incidents transparently
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Status Page Preview */}
                    <div className="lg:col-span-3">
                        <Card className="border-2 border-gray-200 bg-white overflow-hidden">
                            {/* Status Page Header */}
                            <div className="p-8 bg-gradient-to-br from-gray-50 to-white border-b border-gray-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                                        <div className="w-6 h-6 border-4 border-white rounded-full" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl text-gray-900">Your Company Status</h3>
                                        <p className="text-sm text-gray-600">Real-time system status</p>
                                    </div>
                                </div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-black rounded-full">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    <span className="text-sm text-white">All Systems Operational</span>
                                </div>
                            </div>

                            {/* Services List */}
                            <div className="p-8" ref={containerRef}>
                                <h4 className="text-gray-900 mb-4">Service Status</h4>
                                <div className="space-y-3">
                                    {services.map((service, index) => (
                                        <div
                                            key={service.name}
                                            className="status-item flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                            onClick={() => setSelectedService(index)}
                                        >
                                            <div className="flex items-center gap-3">
                                                {getStatusIcon(service.status)}
                                                <span className="text-sm text-gray-900">{service.name}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-gray-500">{service.uptime} uptime</span>
                                                <div className={`px-3 py-1 rounded-full text-xs text-white ${getStatusColor(service.status)}`}>
                                                    {service.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Uptime Chart Visualization */}
                            <div className="px-8 pb-8">
                                <h4 className="text-gray-900 mb-4">90-Day Uptime</h4>
                                <div className="flex items-end gap-0.5 h-16">
                                    {Array.from({ length: 90 }).map((_, i) => {
                                        const uptime = Math.random() > 0.05 ? 100 : Math.random() * 100;
                                        const height = `${Math.max(uptime, 20)}%`;
                                        return (
                                            <div
                                                key={i}
                                                className={`flex-1 rounded-t transition-all hover:opacity-70 cursor-pointer ${uptime === 100 ? 'bg-black' : uptime > 95 ? 'bg-gray-400' : 'bg-gray-300'
                                                    }`}
                                                style={{ height }}
                                                title={`Day ${i + 1}: ${uptime.toFixed(1)}%`}
                                            />
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-gray-500">
                                    <span>90 days ago</span>
                                    <span>Today</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Incident Management */}
                    <div className="lg:col-span-2">
                        <Card className="p-6 border-2 border-gray-200 bg-white h-full">
                            <h3 className="text-gray-900 mb-6">Active Incidents</h3>

                            <div className="space-y-4">
                                {incidents.map((incident, index) => (
                                    <div key={index} className="p-4 border-2 border-gray-200 rounded-lg">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h4 className="text-sm text-gray-900 mb-1">{incident.title}</h4>
                                                <span className="text-xs text-gray-500">{incident.time}</span>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-xs text-white whitespace-nowrap ${getIncidentStatusColor(incident.status)}`}>
                                                {incident.status}
                                            </div>
                                        </div>

                                        <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                                            {incident.updates.map((update, updateIndex) => (
                                                <div key={updateIndex} className="pl-3 border-l-2 border-gray-200">
                                                    <p className="text-xs text-gray-600 mb-1">{update.message}</p>
                                                    <span className="text-xs text-gray-400">{update.time}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <button className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                                    Create New Incident
                                </button>
                            </div>

                            <div className="mt-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-600 mb-2">Recent Updates</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gray-200 rounded-full" />
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-900">Scheduled maintenance</p>
                                            <p className="text-xs text-gray-500">Tomorrow at 2:00 AM</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
}
