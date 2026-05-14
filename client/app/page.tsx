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
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex justify-between items-center px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <TowerControl className="text-primary size-5" />
            <span className="text-lg font-bold text-foreground tracking-tight">Beacn</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <a href="#" className="text-foreground font-medium">Product</a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#global" className="text-muted-foreground hover:text-foreground transition-colors">Coverage</a>
          </div>
          <button
            onClick={() => setShowSignIn(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold mb-6">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-secondary"></span>
            </span>
            Live: Global DNS Monitoring
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground max-w-3xl leading-tight mb-6">
            Synthetic Monitoring That <span className="text-primary">Never Sleeps</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Monitor your APIs, websites, SSL certificates, and DNS from locations worldwide. Get instant alerts before your users do.
          </p>
          <div className="flex gap-4 mb-16">
            <button
              onClick={() => setShowSignIn(true)}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors"
            >
              Start Monitoring <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Dashboard Preview */}
          <div className="w-full relative group mx-auto text-left">
            <div className="bg-card rounded-xl border shadow-sm p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4 space-y-4">
                  <div className="p-4 rounded-lg bg-muted/30 border text-left">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Overall Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                      <span className="text-lg font-semibold text-foreground">Operational</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border text-left">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Uptime (24h)</p>
                    <span className="text-2xl font-bold text-primary tracking-tight">99.998%</span>
                  </div>
                </div>
                <div className="md:col-span-8 bg-muted/30 border rounded-lg p-5 relative min-h-[250px] flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-semibold text-foreground">Response Time (ms)</h3>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded border bg-background text-[10px] font-medium text-foreground">Global Avg</span>
                      <span className="px-2 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary text-[10px] font-medium">Beacn Optimized</span>
                    </div>
                  </div>
                  <div className="h-40 flex items-end gap-1.5 px-2">
                    {[40, 60, 35, 80, 75, 95, 50, 20].map((h, i) => (
                      <div key={i} className="w-full bg-primary/20 rounded-t hover:bg-primary/40 transition-colors" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <div className="border-y bg-muted/10 py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start gap-3 p-4">
            <span className="material-symbols-outlined text-2xl text-secondary">speed</span>
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-1">Sub-second response</h4>
              <p className="text-muted-foreground text-xs">Ultra-fast check intervals up to every 30 seconds.</p>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-start gap-3 p-4">
            <span className="material-symbols-outlined text-2xl text-primary">verified_user</span>
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-1">99.99% uptime SLA</h4>
              <p className="text-muted-foreground text-xs">Our infrastructure is as reliable as yours needs to be.</p>
            </div>
          </div>
          <div className="flex flex-col items-center md:items-start gap-3 p-4">
            <span className="material-symbols-outlined text-2xl text-emerald-600">monitoring</span>
            <div>
              <h4 className="font-semibold text-sm text-foreground mb-1">24/7 monitoring</h4>
              <p className="text-muted-foreground text-xs">Automated probes running every second of every day.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl font-semibold tracking-tight mb-2">Deep Insight, Zero Configuration</h2>
            <p className="text-muted-foreground text-sm max-w-xl">Everything you need to monitor the health of your digital ecosystem in one fluid interface.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[200px]">
            {/* Feature 1 */}
            <div className="md:col-span-8 bg-card border rounded-xl p-6 flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10">
                <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary text-sm">dns</span>
                </div>
                <h3 className="text-base font-semibold mb-1">Monitoring Types</h3>
                <p className="text-muted-foreground max-w-md text-xs leading-relaxed">Check HTTP/S, TCP, UDP, DNS, and ICMP Ping. Monitor SSL certificate expiration and health automatically.</p>
              </div>
              <div className="flex gap-2 relative z-10 mt-4">
                <span className="px-2 py-0.5 border rounded text-[10px] font-semibold text-foreground">SSL</span>
                <span className="px-2 py-0.5 border rounded text-[10px] font-semibold text-foreground">TCP</span>
                <span className="px-2 py-0.5 border rounded text-[10px] font-semibold text-foreground">HTTP</span>
              </div>
            </div>
            {/* Feature 2 */}
            <div className="md:col-span-4 bg-card border rounded-xl p-6 flex flex-col hover:bg-muted/30 transition-colors">
              <div className="w-8 h-8 bg-secondary/10 rounded flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-secondary text-sm">show_chart</span>
              </div>
              <h3 className="text-base font-semibold mb-1">Real-time Charts</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">Visualize latency spikes and error rates with high-resolution granular data points.</p>
            </div>
            {/* Feature 3 */}
            <div className="md:col-span-4 bg-card border rounded-xl p-6 flex flex-col hover:bg-muted/30 transition-colors">
              <div className="w-8 h-8 bg-emerald-600/10 rounded flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-emerald-600 text-sm">notifications_active</span>
              </div>
              <h3 className="text-base font-semibold mb-1">Alerting Channels</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">Slack, Webhooks, and Email. Notify the right people instantly when issues arise.</p>
            </div>
            {/* Feature 4 */}
            <div className="md:col-span-8 bg-card border rounded-xl p-6 flex flex-col justify-between overflow-hidden relative">
              <div className="relative z-10">
                <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-primary text-sm">public</span>
                </div>
                <h3 className="text-base font-semibold mb-1">Status Pages</h3>
                <p className="text-muted-foreground max-w-md text-xs leading-relaxed">Share system health with your customers using beautiful, branded status pages that reflect your reliability.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Coverage Section */}
      <section id="global" className="py-20 px-6 border-t bg-muted/10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-center">
          <div className="md:w-1/2">
            <h2 className="text-4xl font-bold mb-6 leading-tight">Global Probes for <span className="text-secondary italic">True Resilience</span></h2>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">We deploy synthetic probes across global regions to ensure your services are reachable from anywhere on earth.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-card rounded-lg border flex items-center justify-between transition-colors hover:bg-muted/30">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs">🇺🇸</span>
                  <span className="font-medium text-xs">US East</span>
                </div>
                <span className="text-muted-foreground font-medium text-[10px]">12ms</span>
              </div>
              <div className="p-3 bg-card rounded-lg border flex items-center justify-between transition-colors hover:bg-muted/30">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs">🇺🇸</span>
                  <span className="font-medium text-xs">US West</span>
                </div>
                <span className="text-muted-foreground font-medium text-[10px]">45ms</span>
              </div>
              <div className="p-3 bg-card rounded-lg border flex items-center justify-between transition-colors hover:bg-muted/30">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs">🇮🇪</span>
                  <span className="font-medium text-xs">Ireland</span>
                </div>
                <span className="text-muted-foreground font-medium text-[10px]">38ms</span>
              </div>
              <div className="p-3 bg-card rounded-lg border flex items-center justify-between transition-colors hover:bg-muted/30">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs">🇩🇪</span>
                  <span className="font-medium text-xs">Frankfurt</span>
                </div>
                <span className="text-muted-foreground font-medium text-[10px]">42ms</span>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 w-full relative">
            <div className="bg-card border rounded-xl p-2 shadow-sm">
              <img alt="Global Coverage Map" className="w-full rounded-lg grayscale opacity-80 mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkhKChgMMOXu4L2V5yCrR6eMUxoXUzHakyhUuDhLsPnBXYiBorcMIobKFYCewdAtGGAxcvj7ho2gN3U5Cf6jVNIVaGzhVGOEWI0hP7COwAnSyCS18z6vvUCE-YmTTxaygY84yHrqWrJLZPkI_cUyUczMw2i_BN_C0zKseeIpPWqu3vNAbIYYWm7pQvZOlkmv6KmHJjxR4KzzRoSQAXBXPNQjrsHs_Rlnf1TH8G25IEbjySrNPfEClQmkdIFo3Ky--WjqYWoer7w4g" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 border-t">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-2xl font-semibold tracking-tight mb-2">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground text-sm">Plans designed to fit your organization's monitoring needs.</p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <div className="bg-card border rounded-xl p-6 flex flex-col">
            <h3 className="text-base font-semibold mb-1">Free</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-bold tracking-tight">$0</span>
              <span className="text-muted-foreground text-xs font-medium">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="material-symbols-outlined text-primary text-sm">check</span>
                1 Monitor limit
              </li>
              <li className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="material-symbols-outlined text-primary text-sm">check</span>
                15-minute frequency
              </li>
              <li className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="material-symbols-outlined text-primary text-sm">check</span>
                Max 3 regions
              </li>
              <li className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="material-symbols-outlined text-primary text-sm">check</span>
                Email notifications
              </li>
            </ul>
            <button onClick={() => setShowSignIn(true)} className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-semibold transition-colors">Get Started</button>
          </div>

          {/* Pro Plan */}
          <div className="bg-card border-primary/30 ring-1 ring-primary/20 rounded-xl p-6 flex flex-col relative">
            <div className="absolute -top-2.5 inset-x-0 flex justify-center">
              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider rounded-full">Most Popular</span>
            </div>
            <h3 className="text-base font-semibold mb-1">Pro</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-bold tracking-tight">$15</span>
              <span className="text-muted-foreground text-xs font-medium">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="material-symbols-outlined text-primary text-sm">check</span>
                15 Monitors limit
              </li>
              <li className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="material-symbols-outlined text-primary text-sm">check</span>
                1-minute frequency
              </li>
              <li className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="material-symbols-outlined text-primary text-sm">check</span>
                Max 5 regions
              </li>
              <li className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="material-symbols-outlined text-primary text-sm">check</span>
                1 Team (up to 20 users)
              </li>
              <li className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="material-symbols-outlined text-primary text-sm">check</span>
                Role-based access
              </li>
            </ul>
            <button onClick={() => setShowSignIn(true)} className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-xs font-semibold transition-colors">Upgrade to Pro</button>
          </div>

          {/* Pro Plus Plan */}
          <div className="bg-card border rounded-xl p-6 flex flex-col">
            <h3 className="text-base font-semibold mb-1">Pro Plus</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-bold tracking-tight">$59</span>
              <span className="text-muted-foreground text-xs font-medium">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-grow">
              <li className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="material-symbols-outlined text-primary text-sm">check</span>
                50 Monitors limit
              </li>
              <li className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="material-symbols-outlined text-primary text-sm">check</span>
                30-second frequency
              </li>
              <li className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="material-symbols-outlined text-primary text-sm">check</span>
                All regions available
              </li>
              <li className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="material-symbols-outlined text-primary text-sm">check</span>
                1 Team (up to 50 users)
              </li>
              <li className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span className="material-symbols-outlined text-primary text-sm">check</span>
                Priority support
              </li>
            </ul>
            <button onClick={() => setShowSignIn(true)} className="w-full py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-semibold transition-colors">Upgrade to Pro Plus</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/10 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-8 py-16 max-w-5xl mx-auto">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <TowerControl className="text-primary size-5" />
              <span className="text-lg font-bold text-foreground">Beacn</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
              The next generation of synthetic monitoring. Designed for performance, built for trust.
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-xs uppercase tracking-widest text-foreground mb-4">Product</h5>
            <ul className="space-y-3">
              <li><a className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="#features">Features</a></li>
              <li><a className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="#pricing">Pricing</a></li>
              <li><a className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="#">API Reference</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-xs uppercase tracking-widest text-foreground mb-4">Company</h5>
            <ul className="space-y-3">
              <li><a className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="#">About Us</a></li>
              <li><a className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="#">Security</a></li>
              <li><a className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="#">Privacy</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-xs uppercase tracking-widest text-foreground mb-4">Support</h5>
            <ul className="space-y-3">
              <li><a className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="#">Help Center</a></li>
              <li><a className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="#">Status</a></li>
              <li><a className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="#">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-8 py-6 border-t text-center md:text-left">
          <p className="text-[10px] text-muted-foreground">© 2024 Beacn Monitoring. All rights reserved.</p>
        </div>
      </footer>

      {/* Authentication Dialog */}
      <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
        <DialogContent className="sm:max-w-md bg-card border shadow-sm rounded-xl p-6">
          <DialogHeader className="mb-2">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3 mx-auto border border-primary/20">
              <span className="material-symbols-outlined text-primary text-[24px]">lock</span>
            </div>
            <DialogTitle className="text-lg font-semibold text-center text-foreground">Welcome to Beacn</DialogTitle>
            <DialogDescription className="text-center text-muted-foreground font-medium text-xs leading-relaxed mx-auto max-w-sm pt-1">
              Log in to your account or create a new one to start monitoring your infrastructure instantly.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 pt-2">
            <div className="w-full space-y-3">
              <Button
                onClick={() => useAppStore.getState().loginWithGoogle()}
                className="w-full bg-card hover:bg-muted text-foreground border flex items-center gap-3 py-5 rounded-lg shadow-sm transition-all font-semibold text-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>
              <Button
                onClick={() => useAppStore.getState().loginWithGithub()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-3 py-5 rounded-lg shadow-sm transition-all font-semibold text-sm"
              >
                <svg height="20" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="20" data-view-component="true" className="fill-current">
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
