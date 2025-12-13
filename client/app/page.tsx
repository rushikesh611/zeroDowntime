"use client";

import { AlertingChannels } from '@/components/landing/AlertingChannels';
import { MonitoringTypes } from '@/components/landing/MonitoringTypes';
import { RealtimeCharts } from '@/components/landing/RealtimeCharts';
import { StatusPageFeature } from '@/components/landing/StatusPageFeature';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAppStore } from '@/store/useAppStore';
import { Check, Clock, Github, Shield, Zap, Loader2, Mail, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const router = useRouter();
  const { loginWithGithub, loginWithGoogle, user, checkAuth, isLoading } = useAppStore();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const plans = [
    {
      name: "Free",
      price: "0",
      isFree: true,
      features: [
        "3 monitors",
        "5-minute checks",
        "Email alerts only",
        "24-hour data retention",
        "Public status page",
        "Community support"
      ],
      highlighted: false,
      buttonText: "Get Started Free",
      buttonVariant: "default" as const
    },
    {
      name: "Pro",
      price: billingCycle === "monthly" ? "29" : "290",
      features: [
        "50 monitors",
        "30-second checks",
        "Email, SMS, Slack & Discord",
        "90-day data retention",
        "Custom branded status pages",
        "Incident management",
        "Advanced analytics",
        "Priority support",
        "Team collaboration (5 users)"
      ],
      highlighted: true,
      buttonText: "Start Free Trial",
      buttonVariant: "default" as const,
      badge: "Most Popular"
    },
    {
      name: "Enterprise",
      price: "Custom",
      isCustom: true,
      features: [
        "Unlimited monitors",
        "10-second checks",
        "All channels + webhooks",
        "Unlimited data retention",
        "White-label status pages",
        "Advanced incident management",
        "Custom integrations",
        "99.99% uptime SLA",
        "Dedicated account manager",
        "Unlimited team members"
      ],
      highlighted: false,
      buttonText: "Contact Sales",
      buttonVariant: "default" as const
    }
  ];


  useEffect(() => {
    let isMounted = true;

    const performInitialCheck = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        if (isMounted) {
          setIsPageLoading(false);
        }
      }
    };

    performInitialCheck();

    return () => {
      isMounted = false;
    };
  }, [checkAuth]);

  useEffect(() => {
    if (user && !isLoading && !isPageLoading) {
      router.push('/monitors');
    }
  }, [user, isLoading, isPageLoading, router]);

  if (isPageLoading || (user && !isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 -right-20 w-96 h-96 border border-gray-100 rounded-full opacity-50" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 border border-gray-100 rounded-full opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-gray-50 rounded-full opacity-30" />
        </div>

        <div className="relative px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-6xl mx-auto">
            {/* Logo & Brand */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-white rounded-full" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-black rounded-full">
                    <div className="w-5 h-5 bg-black rounded-full animate-ping opacity-75" />
                  </div>
                </div>
                <span className="text-4xl text-gray-900 tracking-tight">Zerodowntime</span>
              </div>

              <h1 className="text-5xl md:text-6xl text-gray-900 mb-6 tracking-tight">
                Synthetic Monitoring
                <br />
                <span className="text-gray-600">That Never Sleeps</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Monitor your APIs, websites, SSL certificates, DNS, and more from locations worldwide.
                Get instant alerts when something goes wrong.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-black hover:bg-gray-800 text-white inline-flex items-center justify-center px-8 h-12 text-base">
                      Start Monitoring for Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle hidden={true} className="text-center text-xl">Welcome back</DialogTitle>
                      <DialogDescription className="text-center">
                        Sign in to your account to continue
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                      {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin mb-4" />
                          <p className="text-sm text-gray-500">Redirecting to login provider...</p>
                        </div>
                      ) : (
                        <>
                          <Button size="lg" variant="outline" className="w-full relative h-12 border-2 hover:bg-gray-50" onClick={loginWithGithub}>
                            <Github className="absolute left-4 h-5 w-5" />
                            Continue with GitHub
                          </Button>
                          <Button size="lg" variant="outline" className="w-full relative h-12 border-2 hover:bg-gray-50" onClick={loginWithGoogle}>
                            <Mail className="absolute left-4 h-5 w-5" />
                            Continue with Google
                          </Button>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-black" />
                  <span>Sub-second response</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-black" />
                  <span>99.99% uptime SLA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-black" />
                  <span>24/7 monitoring</span>
                </div>
              </div>
            </div>

            {/* Hero Visual - Monitoring Dashboard Preview */}
            <div className="relative max-w-5xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-transparent to-gray-100 blur-3xl opacity-50" />
              <Card className="relative border-2 border-gray-200 overflow-hidden bg-white shadow-2xl">
                <div className="p-1 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100">
                  <div className="bg-white p-8">
                    {/* Dashboard Header */}
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white rounded-full" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">System Status</p>
                          <p className="text-gray-900">All systems operational</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
                        <span className="text-sm text-gray-600">Live</span>
                      </div>
                    </div>

                    {/* Mock Monitors */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['API Gateway', 'Web Application', 'Database'].map((name, i) => (
                        <div key={name} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm text-gray-900">{name}</span>
                            <div className="w-2 h-2 bg-black rounded-full" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl text-gray-900">{[45, 234, 12][i]}ms</span>
                            <span className="text-xs text-gray-500">avg latency</span>
                          </div>
                          <div className="mt-3 flex gap-0.5 h-8 items-end">
                            {Array.from({ length: 12 }).map((_, j) => (
                              <div
                                key={j}
                                className="flex-1 bg-gray-300 rounded-t"
                                style={{
                                  height: `${Math.random() * 60 + 40}%`,
                                  backgroundColor: Math.random() > 0.9 ? '#9ca3af' : '#000'
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Monitoring Types */}
      <MonitoringTypes />

      {/* Real-time Charts */}
      <RealtimeCharts />

      {/* Alerting Channels */}
      <AlertingChannels />

      {/* Status Page Feature */}
      <StatusPageFeature />

      {/* Global Coverage Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-gray-900 mb-4">
              Monitor From Everywhere
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Check your endpoints from 25+ locations across 6 continents. Ensure your services are fast for everyone, everywhere.
            </p>
          </div>

          <Card className="border-2 border-gray-200 p-8 bg-gradient-to-br from-gray-50 to-white">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[
                { city: "New York", region: "US East", latency: "12ms" },
                { city: "San Francisco", region: "US West", latency: "18ms" },
                { city: "London", region: "EU West", latency: "23ms" },
                { city: "Frankfurt", region: "EU Central", latency: "19ms" },
                { city: "Singapore", region: "Asia Pacific", latency: "45ms" },
                { city: "Tokyo", region: "Asia East", latency: "38ms" },
                { city: "Sydney", region: "Oceania", latency: "56ms" },
                { city: "Mumbai", region: "Asia South", latency: "42ms" },
                { city: "São Paulo", region: "S. America", latency: "67ms" },
                { city: "Toronto", region: "Canada", latency: "15ms" },
                { city: "Amsterdam", region: "EU West", latency: "21ms" },
                { city: "Seoul", region: "Asia East", latency: "40ms" },
              ].map((location) => (
                <div key={location.city} className="text-center p-4 bg-white rounded-lg border border-gray-200 hover:border-black transition-colors group cursor-pointer">
                  <div className="w-8 h-8 bg-gray-100 group-hover:bg-black rounded-full mx-auto mb-2 flex items-center justify-center transition-colors">
                    <div className="w-2 h-2 bg-gray-400 group-hover:bg-white rounded-full transition-colors" />
                  </div>
                  <p className="text-sm text-gray-900 mb-1">{location.city}</p>
                  <p className="text-xs text-gray-500 mb-2">{location.region}</p>
                  <p className="text-xs text-gray-900">{location.latency}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                + More locations added monthly
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">
              Start monitoring in minutes. No credit card required for trial.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center bg-white rounded-full p-1 border-2 border-gray-200">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-full transition-all ${billingCycle === "monthly"
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2 rounded-full transition-all ${billingCycle === "yearly"
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Yearly
                <span className="ml-2 text-xs bg-black/20 px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative p-8 transition-all border-2 ${plan.highlighted
                  ? "bg-black text-white border-black shadow-2xl scale-105"
                  : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-white text-black px-4 py-1 rounded-full text-xs border-2 border-black">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className={`text-xl mb-6 ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    {(plan as any).isCustom ? (
                      <span className={`text-4xl ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                        {plan.price}
                      </span>
                    ) : (
                      <>
                        <span className={`text-5xl ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                          ${plan.price}
                        </span>
                        {!(plan as any).isFree && (
                          <span className={plan.highlighted ? "text-gray-400" : "text-gray-500"}>
                            /{billingCycle === "monthly" ? "mo" : "yr"}
                          </span>
                        )}
                        {(plan as any).isFree && (
                          <span className={plan.highlighted ? "text-gray-400" : "text-gray-500"}>
                            /forever
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {billingCycle === "yearly" && !(plan as any).isFree && !(plan as any).isCustom && (
                    <p className={`text-sm ${plan.highlighted ? "text-gray-400" : "text-gray-500"}`}>
                      Billed annually
                    </p>
                  )}
                  {(plan as any).isCustom && (
                    <p className={`text-sm ${plan.highlighted ? "text-gray-400" : "text-gray-500"}`}>
                      Tailored to your needs
                    </p>
                  )}
                  {(plan as any).isFree && (
                    <p className={`text-sm ${plan.highlighted ? "text-gray-400" : "text-gray-500"}`}>
                      No credit card required
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? "text-white" : "text-black"
                          }`}
                      />
                      <span className={`text-sm ${plan.highlighted ? "text-gray-300" : "text-gray-600"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${plan.highlighted
                    ? "bg-white hover:bg-gray-100 text-black"
                    : "bg-black hover:bg-gray-800 text-white"
                    }`}
                >
                  {plan.buttonText}
                </Button>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-gray-600">
              All plans include a 14-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-4 sm:px-6 lg:px-8 py-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-gray-900 mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Features</a></li>
                <li><a href="#" className="hover:text-gray-900">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-900">API</a></li>
                <li><a href="#" className="hover:text-gray-900">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">About</a></li>
                <li><a href="#" className="hover:text-gray-900">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900">Careers</a></li>
                <li><a href="#" className="hover:text-gray-900">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Documentation</a></li>
                <li><a href="#" className="hover:text-gray-900">Guides</a></li>
                <li><a href="#" className="hover:text-gray-900">Support</a></li>
                <li><a href="#" className="hover:text-gray-900">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900">Terms</a></li>
                <li><a href="#" className="hover:text-gray-900">Security</a></li>
                <li><a href="#" className="hover:text-gray-900">Compliance</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white rounded-full" />
              </div>
              <span className="text-gray-900">Zerodowntime</span>
            </div>
            <div className="text-sm text-gray-500">
              © 2025 Zerodowntime. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

