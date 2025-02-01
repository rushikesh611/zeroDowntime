"use client";

import { ModeToggle } from '@/components/mode-toggle';
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { useAppStore } from '@/store/useAppStore';
import { Activity, ArrowRight, BarChart, Bell, Clock, Github } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const router = useRouter();
  const { login, user, checkAuth, isLoading } = useAppStore();

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
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link className="flex items-center justify-center" href="#">
          <Activity className="h-6 w-6 text-primary" />
          <span className="ml-2 text-2xl font-bold">ZeroDowntime</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <ModeToggle />
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Keep Your Website Always Online
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Monitor your website&apos;s uptime, get instant alerts, and ensure maximum availability.
                </p>
              </div>
              <div className="space-x-4 flex items-center">
                <Button
                  className="inline-flex items-center justify-center"
                  onClick={login}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Spinner />
                  ) : (
                    <Github className="h-4 w-4" />
                  )}
                  <span className='ml-2'>{isLoading ? 'Logging in...' : 'Login with Github'}</span>
                </Button>


                <Button variant="outline">
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 dark:bg-white dark:text-black">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Key Features</h2>
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-3 text-center">
                <Bell className="h-12 w-12" />
                <h3 className="text-xl font-bold">Instant Alerts</h3>
                <p className="text-gray-500 dark:text-black">
                  Get notified immediately when your website goes down.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-3 text-center">
                <BarChart className="h-12 w-12" />
                <h3 className="text-xl font-bold">Detailed Analytics</h3>
                <p className="text-gray-500 dark:text-black">
                  Detailed reports to help you resolve issues faster.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-3 text-center">
                <Clock className="h-12 w-12" />
                <h3 className="text-xl font-bold">24/7 Monitoring</h3>
                <p className="text-gray-500 dark:text-black">
                  Our system works around the clock, continuously monitoring your website to ensure optimal performance and reliability at all times.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Simple, Transparent Pricing</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
              {[
                {
                  name: "Basic",
                  features: [
                    "Monitor up to 5 websites",
                    "5-minute check intervals",
                    "Email notifications",
                    "7-day data retention"
                  ],
                  price: "$9.99/month"
                },
                {
                  name: "Pro",
                  features: [
                    "Monitor up to 20 websites",
                    "1-minute check intervals",
                    "Email & SMS notifications",
                    "30-day data retention",
                    "API access"
                  ],
                  price: "$29.99/month"
                }
              ].map((plan) => (
                <div key={plan.name} className="flex flex-col p-6 bg-white shadow-lg rounded-lg dark:text-black">
                  <h3 className="text-2xl font-bold text-center mb-4">{plan.name}</h3>
                  <ul className="mb-6 space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <ArrowRight className="mr-2 h-4 w-4" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <p className="text-center font-bold mb-4">{plan.price}</p>
                  <Button className="mt-auto dark:bg-black dark:text-white">
                    Choose Plan
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-black">© 2024 ZeroDowntime. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

