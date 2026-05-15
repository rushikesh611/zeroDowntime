"use client"

import {
    ChevronsUpDown,
    CreditCard,
    LogOut,
    Sparkles
} from "lucide-react";
import Link from 'next/link';

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { useAppStore } from "@/store/useAppStore";

export function NavUser() {
    const { isMobile } = useSidebar()
    const { user, logout } = useAppStore()

    if (!user) return null

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[state=collapsed]:justify-center"
                        >
                            <Avatar className="h-8 w-8 rounded-md border border-border/50 transition-all">
                                <AvatarImage src={user.avatarUrl} alt={user.username} />
                                <AvatarFallback className="rounded-md bg-muted text-muted-foreground text-[10px]">
                                    {user.username?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight group-data-[state=collapsed]:hidden ml-1">
                                <span className="truncate font-semibold text-foreground">{user.username}</span>
                                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4 group-data-[state=collapsed]:hidden text-muted-foreground/50" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-md shadow-lg border-border/50"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                                <Avatar className="h-9 w-9 rounded-md border border-border/50">
                                    <AvatarImage src={user.avatarUrl} alt={user.username} />
                                    <AvatarFallback className="rounded-md bg-muted text-muted-foreground">
                                        {user.username?.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold text-foreground">{user.username}</span>
                                    <div className="flex items-center justify-between gap-2 min-w-0">
                                        <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                                        <span className="shrink-0 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider">{user.plan}</span>
                                    </div>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuGroup>
                            {user.plan?.toUpperCase() === 'FREE' && (
                                <DropdownMenuItem asChild>
                                    <Link href="/billing" className="w-full cursor-pointer text-primary font-medium focus:text-primary focus:bg-primary/5">
                                        <Sparkles className="size-4 mr-2" />
                                        Upgrade to Pro
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            {user.plan?.toUpperCase() === 'PRO' && (
                                <DropdownMenuItem asChild>
                                    <Link href="/billing" className="w-full cursor-pointer text-primary font-medium focus:text-primary focus:bg-primary/5">
                                        <Sparkles className="size-4 mr-2" />
                                        Upgrade to Pro Plus
                                    </Link>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href="/billing" className="w-full flex items-center">
                                    <CreditCard className="size-4 mr-2 text-muted-foreground" />
                                    Billing
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5">
                            <LogOut className="size-4 mr-2" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
