"use client"

import { useState } from "react";
import {
    Bug,
    ChevronsUpDown,
    CreditCard,
    ExternalLink,
    LifeBuoy,
    LogOut,
    Mail,
    ShieldCheck,
    Sparkles
} from "lucide-react";
import Link from 'next/link';

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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

const GITHUB_ISSUES_URL = "https://github.com/rushikesh611/zeroDowntime/issues";
const SUPPORT_EMAIL = "rushi611@gmail.com";

export function NavUser() {
    const { isMobile } = useSidebar()
    const { user, logout } = useAppStore()
    const [supportOpen, setSupportOpen] = useState(false)

    if (!user) return null

    return (
        <>
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
                                <DropdownMenuItem
                                    className="cursor-pointer"
                                    onSelect={() => setSupportOpen(true)}
                                >
                                    <LifeBuoy className="size-4 mr-2 text-muted-foreground" />
                                    Support & Help
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

            {/* Support Dialog */}
            <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <LifeBuoy className="size-5 text-primary" />
                            How can we help?
                        </DialogTitle>
                        <DialogDescription>
                            Choose the option that best describes your needs.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 pt-2">
                        {/* Public: Bug Reports & Feature Requests */}
                        <a
                            href={`${GITHUB_ISSUES_URL}/new`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start gap-4 rounded-lg border border-border/60 p-4 transition-all hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-orange-500/10 text-orange-500 transition-colors group-hover:bg-orange-500/20">
                                <Bug className="size-5" />
                            </div>
                            <div className="grid gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-foreground">Report a Bug or Feature Request</span>
                                    <ExternalLink className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Found a bug or have an idea? Open an issue on GitHub — our community and team will help.
                                </p>
                            </div>
                        </a>

                        {/* Private: Account, Billing & Security */}
                        <a
                            href={`mailto:${SUPPORT_EMAIL}?subject=Support Request — ${user.username} (${user.plan} Plan)`}
                            className="group flex items-start gap-4 rounded-lg border border-border/60 p-4 transition-all hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-500 transition-colors group-hover:bg-blue-500/20">
                                <ShieldCheck className="size-5" />
                            </div>
                            <div className="grid gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm text-foreground">Account, Billing & Security</span>
                                    <Mail className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Need help with your account, billing, or a security concern? Email us directly — it stays private.
                                </p>
                            </div>
                        </a>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
