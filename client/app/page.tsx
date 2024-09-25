"use client";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { Button } from "@/components/ui/button";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

import { useAuthStore } from '@/store/useAuthStore'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from "@/components/spinner";

export default function Home() {
  const { login, user, checkAuth, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner/>
      </div>
    );
  }

  return (
    <div>
      <BackgroundBeams className="-z-50" />

      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-6xl text-white">ZeroDowntime</h1>
          <p></p>
          <Button className="w-44 mt-7" onClick={login}>
            Login with Github
            <GitHubLogoIcon className="ml-2" width={20} height={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}