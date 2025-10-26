import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Mail, MessageSquare, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card } from "../ui/card";

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

export function AlertingChannels() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeChannels, setActiveChannels] = useState<number[]>([]);
    const [notifications, setNotifications] = useState<{ id: number; channel: string; time: string }[]>([]);

    const channels = [
        {
            name: "Email",
            icon: Mail,
            desc: "Instant email notifications to your team",
            color: "bg-black",
            logo: "📧"
        },
        {
            name: "SMS",
            icon: Smartphone,
            desc: "Critical alerts via text message",
            color: "bg-gray-800",
            logo: "💬"
        },
        {
            name: "Slack",
            icon: MessageSquare,
            desc: "Real-time alerts in your Slack channels",
            color: "bg-gray-700",
            logo: "💼"
        },
        {
            name: "Discord",
            icon: MessageSquare,
            desc: "Get notified in your Discord server",
            color: "bg-gray-600",
            logo: "🎮"
        },
    ];

    useEffect(() => {
        if (containerRef.current) {
            const cards = containerRef.current.querySelectorAll('.alert-card');

            gsap.fromTo(
                cards,
                { opacity: 0, scale: 0.9 },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 0.5,
                    stagger: 0.1,
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top 80%",
                    }
                }
            );
        }

        // Simulate alert notifications
        const interval = setInterval(() => {
            const randomChannel = Math.floor(Math.random() * channels.length);

            setActiveChannels([randomChannel]);

            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            setNotifications(prev => {
                const newNotification = {
                    id: Date.now(),
                    channel: channels[randomChannel].name,
                    time: timeString
                };
                return [newNotification, ...prev.slice(0, 4)];
            });

            setTimeout(() => {
                setActiveChannels([]);
            }, 2000);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="px-4 sm:px-6 lg:px-8 py-20 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-gray-900 mb-4">
                        Alerts Your Way
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Get notified instantly through your preferred channels when something goes wrong
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Channels Grid */}
                    <div ref={containerRef} className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {channels.map((channel, index) => {
                            const Icon = channel.icon;
                            const isActive = activeChannels.includes(index);

                            return (
                                <Card
                                    key={channel.name}
                                    className={`alert-card p-6 border-2 transition-all duration-300 ${isActive
                                            ? 'border-black shadow-xl scale-105'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-black' : 'bg-gray-100'
                                            }`}>
                                            <Icon className={`w-6 h-6 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-900'
                                                }`} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-gray-900 mb-1">{channel.name}</h3>
                                            <p className="text-sm text-gray-600">{channel.desc}</p>
                                        </div>
                                    </div>

                                    {isActive && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 animate-pulse">
                                            <div className="flex items-center gap-2 text-sm">
                                                <div className="w-2 h-2 bg-black rounded-full" />
                                                <span className="text-gray-900">Alert sent</span>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>

                    {/* Notification Feed */}
                    <Card className="p-6 border-2 border-gray-200 bg-white h-fit">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm">🔔</span>
                            </div>
                            <h3 className="text-gray-900">Recent Alerts</h3>
                        </div>

                        <div className="space-y-3">
                            {notifications.length === 0 ? (
                                <div className="text-center py-8 text-sm text-gray-400">
                                    Waiting for alerts...
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className="p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300"
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <p className="text-sm text-gray-900">Endpoint Down</p>
                                            <span className="text-xs text-gray-500">{notification.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-600">via {notification.channel}</span>
                                            <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                            <span className="text-xs text-gray-600">api.example.com</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                                <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                                    View all alerts →
                                </button>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </section>
    );
}
