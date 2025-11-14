import { Zap } from "lucide-react";
import Link from "next/link";

import { Menu } from "@/components/dashboard/menu";
import { SidebarToggle } from "@/components/dashboard/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export function Sidebar() {
    const sidebar = useAppStore((state) => state);

    if (!sidebar) return null;

    return (
        <aside
            className={cn(
                "fixed top-0 left-0 z-20 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300 border-r bg-card",
                sidebar?.isSidebarOpen === false ? "w-[90px]" : "w-72"
            )}
        >
            <SidebarToggle isOpen={sidebar?.isSidebarOpen} setIsOpen={sidebar?.toggleSidebar} />
            <div className="relative h-full flex flex-col px-3 py-4 overflow-hidden">
                <Button
                    className={cn(
                        "transition-transform ease-in-out duration-300 mb-1 h-14 hover:no-underline",
                        sidebar?.isSidebarOpen === false ? "translate-x-1" : "translate-x-0"
                    )}
                    variant="ghost"
                    asChild
                >
                    <Link href="/monitors" className="flex items-center gap-2">
                        <div className={cn(
                            "rounded-lg bg-primary p-2 transition-all duration-300",
                            sidebar?.isSidebarOpen === false ? "scale-100" : "scale-95"
                        )}>
                            <Zap className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
                        </div>
                        <div
                            className={cn(
                                "flex flex-col items-start transition-[transform,opacity,display] ease-in-out duration-300",
                                sidebar?.isSidebarOpen === false
                                    ? "-translate-x-96 opacity-0 hidden"
                                    : "translate-x-0 opacity-100"
                            )}
                        >
                            <h1 className="font-bold text-lg whitespace-nowrap tracking-tight">
                                ZeroDowntime
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                Monitor
                            </p>
                        </div>
                    </Link>
                </Button>

                {/* Decorative divider */}
                <div className={cn(
                    "h-px bg-gradient-to-r from-transparent via-border to-transparent my-4 transition-opacity duration-300",
                    sidebar?.isSidebarOpen === false ? "opacity-0" : "opacity-100"
                )} />

                <Menu isOpen={sidebar?.isSidebarOpen} />
            </div>
        </aside>
    );
}