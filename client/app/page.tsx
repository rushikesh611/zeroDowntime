"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  TowerControl
} from "lucide-react"

export default function Home() {
  const router = useRouter();
  const checkAuth = useAppStore((state) => state.checkAuth);
  const isLoading = useAppStore((state) => state.isLoading);
  const user = useAppStore((state) => state.user);
  const [showSignIn, setShowSignIn] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/monitors");
    }
  }, [isLoading, user, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="bg-background selection:bg-primary-container selection:text-on-primary-container min-h-screen">
      {/* TopAppBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-sm shadow-violet-500/5">
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <TowerControl className="text-violet-600 text-2xl" />
            <span className="text-2xl font-extrabold bg-gradient-to-br from-violet-600 to-indigo-400 bg-clip-text text-transparent">Beacn</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-violet-700 font-semibold border-b-2 border-violet-500 pb-1">Product</a>
            <a href="#features" className="text-slate-600 hover:text-violet-500 transition-colors">Features</a>
            <a href="#pricing" className="text-slate-600 hover:text-violet-500 transition-colors">Pricing</a>
            <a href="#global" className="text-slate-600 hover:text-violet-500 transition-colors">Security</a>
          </div>
          <button
            onClick={() => setShowSignIn(true)}
            className="bg-gradient-to-br from-primary to-primary-container text-white px-6 py-2.5 rounded-full font-semibold shadow-lg shadow-primary/20 hover:scale-95 active:scale-90 transition-all duration-200"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 hero-gradient overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold tracking-wider mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
            </span>
            NOW LIVE: GLOBAL DNS MONITORING
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-on-surface max-w-4xl leading-tight mb-8">
            Synthetic Monitoring That <span className="text-primary italic">Never Sleeps</span>
          </h1>
          <p className="text-xl text-on-surface-variant max-w-2xl mb-12 leading-relaxed">
            Monitor your APIs, websites, SSL certificates, and DNS from locations worldwide. Get instant alerts before your users do.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-20">
            <button
              onClick={() => setShowSignIn(true)}
              className="bg-gradient-to-br from-primary to-primary-container text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/25 flex items-center gap-2 hover:scale-[0.98] transition-transform"
            >
              Start Monitoring <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>

          {/* Dashboard Preview */}
          <div className="relative w-full max-w-5xl group mx-auto text-left">
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-200 to-emerald-100 opacity-30 blur-3xl rounded-[3rem]"></div>
            <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-200/50 p-4 md:p-8 border-[0.5px] border-white/50">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-3 space-y-6">
                  <div className="p-6 rounded-2xl bg-surface-container-low text-left">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Overall Status</p>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_12px_rgba(0,109,74,0.4)]"></div>
                      <span className="text-2xl font-bold text-on-surface">Operational</span>
                    </div>
                  </div>
                  <div className="p-6 rounded-2xl bg-surface-container-low text-left">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Uptime (24h)</p>
                    <span className="text-3xl font-extrabold text-primary tracking-tight">99.998%</span>
                  </div>
                </div>
                <div className="md:col-span-9 bg-surface-container-low rounded-2xl p-6 relative min-h-[300px] flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-bold text-on-surface">Response Time (ms)</h3>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 rounded-full bg-white text-xs font-medium shadow-sm text-on-surface">Global Avg</span>
                      <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Beacn Optimized</span>
                    </div>
                  </div>
                  <div className="h-48 flex items-end gap-2 px-4">
                    <div className="w-full bg-primary/10 rounded-t-lg hover:bg-primary/40 transition-colors" style={{ height: "40%" }}></div>
                    <div className="w-full bg-primary/20 rounded-t-lg hover:bg-primary/40 transition-colors" style={{ height: "60%" }}></div>
                    <div className="w-full bg-primary/10 rounded-t-lg hover:bg-primary/40 transition-colors" style={{ height: "35%" }}></div>
                    <div className="w-full bg-primary/40 rounded-t-lg hover:bg-primary/60 transition-colors" style={{ height: "80%" }}></div>
                    <div className="w-full bg-primary/60 rounded-t-lg hover:bg-primary/80 transition-colors" style={{ height: "75%" }}></div>
                    <div className="w-full bg-primary rounded-t-lg hover:bg-primary-dim transition-colors" style={{ height: "95%" }}></div>
                    <div className="w-full bg-primary/30 rounded-t-lg hover:bg-primary/50 transition-colors" style={{ height: "50%" }}></div>
                    <div className="w-full bg-primary/10 rounded-t-lg hover:bg-primary/30 transition-colors" style={{ height: "20%" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <div className="bg-surface-container-low py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-4 p-6 hover:bg-white/50 transition-colors rounded-2xl">
            <span className="material-symbols-outlined text-4xl text-secondary">speed</span>
            <div>
              <h4 className="font-bold text-xl text-on-surface mb-1">Sub-second response</h4>
              <p className="text-on-surface-variant text-sm">Ultra-fast check intervals up to every 10 seconds.</p>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-start gap-4 p-6 hover:bg-white/50 transition-colors rounded-2xl">
            <span className="material-symbols-outlined text-4xl text-primary">verified_user</span>
            <div>
              <h4 className="font-bold text-xl text-on-surface mb-1">99.99% uptime SLA</h4>
              <p className="text-on-surface-variant text-sm">Our infrastructure is as reliable as yours needs to be.</p>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-start gap-4 p-6 hover:bg-white/50 transition-colors rounded-2xl">
            <span className="material-symbols-outlined text-4xl text-tertiary">monitoring</span>
            <div>
              <h4 className="font-bold text-xl text-on-surface mb-1">24/7 monitoring</h4>
              <p className="text-on-surface-variant text-sm">Automated probes running every second of every day.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-4xl font-bold mb-4">Deep Insight, <span className="text-primary italic">Zero Configuration</span></h2>
            <p className="text-on-surface-variant max-w-xl">Everything you need to monitor the health of your digital ecosystem in one fluid interface.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[250px]">
            {/* Feature 1 */}
            <div className="md:col-span-8 bg-surface-container-lowest rounded-3xl p-8 flex flex-col justify-between group overflow-hidden relative border-[0.5px] border-slate-100 shadow-sm">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary">dns</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Monitoring Types</h3>
                <p className="text-on-surface-variant max-w-md text-sm leading-relaxed">Check HTTP/S, TCP, UDP, DNS, and ICMP Ping. Monitor SSL certificate expiration and health automatically.</p>
              </div>
              <div className="flex gap-2 relative z-10">
                <span className="px-3 py-1 bg-surface-container-low rounded-full text-[10px] font-bold uppercase tracking-wider text-on-surface">SSL</span>
                <span className="px-3 py-1 bg-surface-container-low rounded-full text-[10px] font-bold uppercase tracking-wider text-on-surface">TCP</span>
                <span className="px-3 py-1 bg-surface-container-low rounded-full text-[10px] font-bold uppercase tracking-wider text-on-surface">HTTP</span>
              </div>
            </div>
            {/* Feature 2 */}
            <div className="md:col-span-4 bg-surface-container rounded-3xl p-8 flex flex-col group hover:bg-surface-container-high transition-colors">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-secondary">show_chart</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Real-time Charts</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">Visualize latency spikes and error rates with high-resolution granular data points.</p>
            </div>
            {/* Feature 3 */}
            <div className="md:col-span-4 bg-surface-container rounded-3xl p-8 flex flex-col group hover:bg-surface-container-high transition-colors">
              <div className="w-12 h-12 bg-tertiary/10 rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-tertiary">notifications_active</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Alerting Channels</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">Slack, PagerDuty, Webhooks, and Email. Notify the right people instantly.</p>
            </div>
            {/* Feature 4 */}
            <div className="md:col-span-8 bg-surface-container-lowest rounded-3xl p-8 flex flex-col justify-between overflow-hidden relative border-[0.5px] border-slate-100 shadow-sm">
              <div className="absolute bottom-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 transition-transform">
                <div className="bg-white p-4 rounded-xl shadow-xl border-[0.5px] border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-secondary"></div>
                    <span className="text-[10px] font-bold">API Gateway Status</span>
                  </div>
                  <div className="flex gap-0.5">
                    <div className="w-1.5 h-6 bg-secondary/80 rounded-full"></div>
                    <div className="w-1.5 h-6 bg-secondary/80 rounded-full"></div>
                    <div className="w-1.5 h-6 bg-secondary/80 rounded-full"></div>
                    <div className="w-1.5 h-6 bg-error/40 rounded-full"></div>
                    <div className="w-1.5 h-6 bg-secondary/80 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div>
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary">public</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Status Pages</h3>
                <p className="text-on-surface-variant max-w-md text-sm leading-relaxed">Share system health with your customers using beautiful, branded status pages that reflect your reliability.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Coverage Section */}
      <section id="global" className="py-24 px-6 bg-surface-container-low border-y border-surface-variant/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-16 items-center">
          <div className="md:w-1/2">
            <h2 className="text-4xl font-bold mb-6 leading-tight">Global Probes for <span className="text-secondary italic">True Resilience</span></h2>
            <p className="text-on-surface-variant text-lg mb-10">We deploy synthetic probes across 15+ global regions to ensure your services are reachable from anywhere on earth.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-2xl shadow-sm flex items-center justify-between hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">🇺🇸</span>
                  <span className="font-semibold text-sm">New York</span>
                </div>
                <span className="text-secondary font-bold text-xs px-2 py-1 bg-secondary/5 rounded-lg">12ms</span>
              </div>
              <div className="p-4 bg-white rounded-2xl shadow-sm flex items-center justify-between hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">🇬🇧</span>
                  <span className="font-semibold text-sm">London</span>
                </div>
                <span className="text-secondary font-bold text-xs px-2 py-1 bg-secondary/5 rounded-lg">45ms</span>
              </div>
              <div className="p-4 bg-white rounded-2xl shadow-sm flex items-center justify-between hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">🇩🇪</span>
                  <span className="font-semibold text-sm">Frankfurt</span>
                </div>
                <span className="text-secondary font-bold text-xs px-2 py-1 bg-secondary/5 rounded-lg">38ms</span>
              </div>
              <div className="p-4 bg-white rounded-2xl shadow-sm flex items-center justify-between hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">🇯🇵</span>
                  <span className="font-semibold text-sm">Tokyo</span>
                </div>
                <span className="text-tertiary font-bold text-xs px-2 py-1 bg-tertiary/5 rounded-lg">142ms</span>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 relative">
            <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full"></div>
            <div className="relative bg-white/40 backdrop-blur-md rounded-[2.5rem] p-4 shadow-inner border border-white">
              <img alt="Global Coverage Map" className="w-full rounded-[2rem] grayscale opacity-80 mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkhKChgMMOXu4L2V5yCrR6eMUxoXUzHakyhUuDhLsPnBXYiBorcMIobKFYCewdAtGGAxcvj7ho2gN3U5Cf6jVNIVaGzhVGOEWI0hP7COwAnSyCS18z6vvUCE-YmTTxaygY84yHrqWrJLZPkI_cUyUczMw2i_BN_C0zKseeIpPWqu3vNAbIYYWm7pQvZOlkmv6KmHJjxR4KzzRoSQAXBXPNQjrsHs_Rlnf1TH8G25IEbjySrNPfEClQmkdIFo3Ky--WjqYWoer7w4g" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold mb-6">Simple, Transparent <span className="text-primary italic">Pricing</span></h2>
          <div className="inline-flex items-center gap-4 bg-surface-container-high p-1 rounded-full">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full font-bold text-sm ${billingCycle === "monthly" ? "bg-white text-on-surface shadow-sm" : "text-on-surface-variant hover:bg-white/50 transition-colors"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2 rounded-full font-bold text-sm ${billingCycle === "yearly" ? "bg-white text-on-surface shadow-sm" : "text-on-surface-variant hover:bg-white/50 transition-colors"}`}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <div className="bg-surface-container-low rounded-[2rem] p-10 flex flex-col transition-transform hover:-translate-y-2">
            <h3 className="text-xl font-bold mb-2">Free</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-extrabold">$0</span>
              <span className="text-on-surface-variant">/mo</span>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-sm font-medium">
                <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                5 Monitors
              </li>
              <li className="flex items-center gap-3 text-sm font-medium">
                <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                5-minute intervals
              </li>
              <li className="flex items-center gap-3 text-sm font-medium">
                <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Email Alerts
              </li>
            </ul>
            <button onClick={() => setShowSignIn(true)} className="w-full py-4 bg-surface-container-highest rounded-xl font-bold text-on-surface hover:bg-surface-container-high transition-colors">Get Started</button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-[2rem] p-10 flex flex-col border-4 border-primary/10 shadow-2xl shadow-primary/5 transition-transform hover:-translate-y-2 relative overflow-hidden">
            <div className="absolute top-4 right-4 px-4 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-full">Popular</div>
            <h3 className="text-xl font-bold mb-2">Pro</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-extrabold">{billingCycle === "monthly" ? "$29" : "$24"}</span>
              <span className="text-on-surface-variant">/mo</span>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-sm font-medium">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                50 Monitors
              </li>
              <li className="flex items-center gap-3 text-sm font-medium">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                30-second intervals
              </li>
              <li className="flex items-center gap-3 text-sm font-medium">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                All Alert Channels
              </li>
              <li className="flex items-center gap-3 text-sm font-medium">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Global Locations (15+)
              </li>
            </ul>
            <button onClick={() => setShowSignIn(true)} className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform">Start Pro Trial</button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-surface-container-low rounded-[2rem] p-10 flex flex-col transition-transform hover:-translate-y-2">
            <h3 className="text-xl font-bold mb-2">Enterprise</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-extrabold">{billingCycle === "monthly" ? "$99" : "$79"}</span>
              <span className="text-on-surface-variant">/mo</span>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3 text-sm font-medium">
                <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Unlimited Monitors
              </li>
              <li className="flex items-center gap-3 text-sm font-medium">
                <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                10-second intervals
              </li>
              <li className="flex items-center gap-3 text-sm font-medium">
                <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Dedicated Support
              </li>
              <li className="flex items-center gap-3 text-sm font-medium">
                <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                SLA Guarantee
              </li>
            </ul>
            <button onClick={() => setShowSignIn(true)} className="w-full py-4 bg-surface-container-highest rounded-xl font-bold text-on-surface hover:bg-surface-container-high transition-colors">Contact Sales</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 w-full rounded-t-[2rem]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 px-12 py-20 max-w-7xl mx-auto">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <TowerControl className="text-violet-600 text-2xl" />
              <span className="text-xl font-bold text-slate-900">Beacn</span>
            </div>
            <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
              The next generation of synthetic monitoring. Designed for performance, built for trust.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-sm uppercase tracking-widest text-slate-900 mb-6">Product</h5>
            <ul className="space-y-4">
              <li><a className="text-sm text-slate-500 hover:text-violet-500 underline-offset-4 hover:underline transition-all" href="#features">Features</a></li>
              <li><a className="text-sm text-slate-500 hover:text-violet-500 underline-offset-4 hover:underline transition-all" href="#pricing">Pricing</a></li>
              <li><a className="text-sm text-slate-500 hover:text-violet-500 underline-offset-4 hover:underline transition-all" href="#">API Reference</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-sm uppercase tracking-widest text-slate-900 mb-6">Company</h5>
            <ul className="space-y-4">
              <li><a className="text-sm text-slate-500 hover:text-violet-500 underline-offset-4 hover:underline transition-all" href="#">About Us</a></li>
              <li><a className="text-sm text-slate-500 hover:text-violet-500 underline-offset-4 hover:underline transition-all" href="#">Security</a></li>
              <li><a className="text-sm text-slate-500 hover:text-violet-500 underline-offset-4 hover:underline transition-all" href="#">Privacy</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-sm uppercase tracking-widest text-slate-900 mb-6">Support</h5>
            <ul className="space-y-4">
              <li><a className="text-sm text-slate-500 hover:text-violet-500 underline-offset-4 hover:underline transition-all" href="#">Help Center</a></li>
              <li><a className="text-sm text-slate-500 hover:text-violet-500 underline-offset-4 hover:underline transition-all" href="#">Status</a></li>
              <li><a className="text-sm text-slate-500 hover:text-violet-500 underline-offset-4 hover:underline transition-all" href="#">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-12 py-8 border-t border-slate-200/50 text-center md:text-left">
          <p className="text-xs text-slate-400">© 2024 Beacn Monitoring. All rights reserved.</p>
        </div>
      </footer>

      {/* Authentication Dialog */}
      <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
        <DialogContent className="sm:max-w-md bg-surface-container-lowest border border-surface-variant shadow-2xl rounded-[2rem] p-8">
          <DialogHeader className="mb-2">
            <div className="w-14 h-14 bg-primary/10 rounded-[1.2rem] flex items-center justify-center mb-4 mx-auto border border-primary/20">
              <span className="material-symbols-outlined text-primary text-[32px]">lock</span>
            </div>
            <DialogTitle className="text-2xl font-bold text-center text-on-surface">Welcome to Beacn</DialogTitle>
            <DialogDescription className="text-center text-on-surface-variant font-medium text-sm leading-relaxed mx-auto max-w-sm pt-2">
              Log in to your account or create a new one to start monitoring your infrastructure instantly.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-6 pt-2 pb-4">
            <div className="w-full space-y-3">
              <Button
                onClick={() => useAppStore.getState().loginWithGoogle()}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center gap-3 py-6 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all font-bold text-base"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
              <Button
                onClick={() => useAppStore.getState().loginWithGithub()}
                className="w-full bg-[#24292e] hover:bg-[#2b3137] text-white flex items-center gap-3 py-6 rounded-2xl shadow-md transition-all font-bold text-base"
              >
                <svg height="24" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="24" data-view-component="true" className="fill-current">
                  <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
                </svg>
                Continue with GitHub
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
