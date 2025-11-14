import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Activity, FileCode, Globe, Lock, Mail, Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card } from "../ui/card";

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

export function MonitoringTypes() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeType, setActiveType] = useState(0);

    const monitoringTypes = [
        {
            icon: FileCode,
            name: "API Monitoring",
            desc: "Monitor REST, GraphQL, and SOAP endpoints",
            color: "bg-black"
        },
        {
            icon: Globe,
            name: "Website Monitoring",
            desc: "Track page load times and availability",
            color: "bg-gray-800"
        },
        {
            icon: Lock,
            name: "SSL Certificate",
            desc: "Get alerts before certificates expire",
            color: "bg-gray-700"
        },
        {
            icon: Radio,
            name: "DNS Monitoring",
            desc: "Verify DNS records and propagation",
            color: "bg-gray-600"
        },
        {
            icon: Mail,
            name: "SMTP Monitoring",
            desc: "Monitor email server health",
            color: "bg-gray-500"
        },
        {
            icon: Activity,
            name: "Ping Monitoring",
            desc: "Check server reachability and latency",
            color: "bg-gray-400"
        },
    ];

    useEffect(() => {
        if (containerRef.current) {
            const cards = containerRef.current.querySelectorAll('.monitoring-card');

            gsap.fromTo(
                cards,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top 80%",
                    }
                }
            );
        }

        const interval = setInterval(() => {
            setActiveType((prev) => (prev + 1) % monitoringTypes.length);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="px-4 sm:px-6 lg:px-8 py-20 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-gray-900 mb-4">
                        Monitor Everything That Matters
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Comprehensive synthetic monitoring for all your critical infrastructure
                    </p>
                </div>

                <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {monitoringTypes.map((type, index) => {
                        const Icon = type.icon;
                        const isActive = activeType === index;

                        return (
                            <Card
                                key={type.name}
                                className={`monitoring-card p-6 border-2 transition-all duration-500 cursor-pointer group hover:border-black ${isActive ? 'border-black shadow-lg scale-105' : 'border-gray-200'
                                    }`}
                                onMouseEnter={() => setActiveType(index)}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 ${isActive ? 'bg-black' : 'bg-gray-100 group-hover:bg-gray-200'
                                    }`}>
                                    <Icon className={`w-6 h-6 transition-all duration-500 ${isActive ? 'text-white' : 'text-gray-900'
                                        }`} />
                                </div>
                                <h3 className="text-gray-900 mb-2">{type.name}</h3>
                                <p className="text-sm text-gray-600">{type.desc}</p>

                                {isActive && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-500">Status</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                                                <span className="text-gray-900">Monitoring</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
