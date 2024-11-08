import { Zap } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Menu } from "@/components/dashboard/menu";
import { SidebarToggle } from "@/components/dashboard/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/useAppStore";

export function Sidebar() {
    const sidebar = useAppStore((state) => state);

    if (!sidebar) return null;

    return (
        <aside
            className={cn(
                "fixed top-0 left-0 z-20 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300",
                sidebar?.isSidebarOpen === false ? "w-[90px]" : "w-72"
            )}
        >
            <SidebarToggle isOpen={sidebar?.isSidebarOpen} setIsOpen={sidebar?.toggleSidebar} />
            <div className="relative h-full flex flex-col px-3 py-4 overflow-y-auto shadow-md dark:shadow-zinc-800">
                <Button
                    className={cn(
                        "transition-transform ease-in-out duration-300 mb-1",
                        sidebar?.isSidebarOpen === false ? "translate-x-1" : "translate-x-0"
                    )}
                    variant="link"
                    asChild
                >
                    <Link href="/monitors" className="flex items-center gap-2 hover:no-underline">
                        <Zap className="w-6 h-6 mr-1" />
                        <h1
                            className={cn(
                                "font-bold text-lg whitespace-nowrap transition-[transform,opacity,display] ease-in-out duration-300",
                                sidebar?.isSidebarOpen === false
                                    ? "-translate-x-96 opacity-0 hidden"
                                    : "translate-x-0 opacity-100"
                            )}
                        >
                            ZeroDowntime
                        </h1>
                    </Link>
                </Button>
                <Menu isOpen={sidebar?.isSidebarOpen} />
            </div>
        </aside>
    );
}