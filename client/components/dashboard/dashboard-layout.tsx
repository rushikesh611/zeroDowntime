"use client";

import { Footer } from "@/components/dashboard/footer";
import { Sidebar } from "@/components/dashboard/sidebar";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { useEffect, useState } from "react";
import { Toaster } from "../ui/toaster";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const sidebar = useAppStore((state) => state);

  if (!sidebar) return null;

  useEffect(() => {
    const user = useAppStore.getState().user;
    if (!user) {
      window.location.href = '/';
      console.log(user)
      console.log(isAuthenticated)
    } else {
      setIsAuthenticated(true);
    }
  });

  if (!sidebar || !isAuthenticated) return null;

  return (
    <>
      <Sidebar />
      <main
        className={cn(
          "min-h-[calc(100vh_-_56px)] bg-zinc-50 dark:bg-zinc-900 transition-[margin-left] ease-in-out duration-300",
          sidebar?.isSidebarOpen === false ? "lg:ml-[90px]" : "lg:ml-72"
        )}
      >
        {children}
      </main>
      <Toaster/>
      <footer
        className={cn(
          "transition-[margin-left] ease-in-out duration-300",
          sidebar?.isSidebarOpen === false ? "lg:ml-[90px]" : "lg:ml-72"
        )}
      >
        <Footer />
      </footer>
    </>
  );
}