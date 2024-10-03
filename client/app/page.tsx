"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Button } from "@/components/ui/button";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Spinner } from "@/components/spinner";
import { useAppStore } from '@/store/useAppStore';

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

  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <main className="relative w-full min-h-screen overflow-hidden">
      <BackgroundBeams className="absolute inset-0 -z-10" />
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl text-center mb-4">
          ZeroDowntime
        </h1>
        <Button 
          className="w-full max-w-xs mt-4 flex items-center justify-center"
          onClick={login}
          disabled={isLoading}
        >
          {isLoading ? (
            <Spinner/>
          ) : (
            <GitHubLogoIcon className="mr-2" width={20} height={20} />
          )}
          <span>{isLoading ? 'Logging in...' : 'Login with Github'}</span>
        </Button>
      </div>
    </main>
  );
}