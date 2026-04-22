"use client"

import {
    BadgeCheck,
    Bell,
    ChevronsUpDown,
    CreditCard,
    LogOut,
    Sparkles,
    Users,
} from "lucide-react"
import Link from 'next/link';

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"
import { useAppStore } from "@/store/useAppStore"

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
                            <Avatar className="h-8 w-8 rounded-xl ring-2 ring-sidebar-border/50 transition-all">
                                <AvatarImage src={user.avatarUrl} alt={user.username} />
                                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight group-data-[state=collapsed]:hidden">
                                <span className="truncate font-semibold">{user.username}</span>
                                <span className="truncate text-xs">{user.email}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4 group-data-[state=collapsed]:hidden" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user.avatarUrl} alt={user.username} />
                                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{user.username}</span>
                                    <div className="flex items-center justify-between gap-2 min-w-0">
                                        <span className="truncate text-xs text-sidebar-foreground/60">{user.email}</span>
                                        <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">{user.plan}</span>
                                    </div>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            {user.plan?.toUpperCase() === 'FREE' && (
                                <DropdownMenuItem asChild>
                                    <Link href="/billing" className="w-full cursor-pointer text-primary font-medium">
                                        <Sparkles className="size-4 mr-2" />
                                        Upgrade to Pro
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            {user.plan?.toUpperCase() === 'PRO' && (
                                <DropdownMenuItem asChild>
                                    <Link href="/billing" className="w-full cursor-pointer text-primary font-medium">
                                        <Sparkles className="size-4 mr-2" />
                                        Upgrade to Pro Plus
                                    </Link>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link href="/team" className="w-full cursor-pointer">
                                    <Users className="size-4 mr-2" />
                                    Team
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <BadgeCheck className="size-4 mr-2" />
                                Account
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/billing" className="w-full cursor-pointer">
                                    <CreditCard className="size-4 mr-2" />
                                    Billing
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout}>
                            <LogOut className="size-4 mr-2" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
