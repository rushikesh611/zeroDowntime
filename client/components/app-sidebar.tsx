"use client"

import {
    ChevronRight,
    TowerControl
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { NavUser } from "@/components/nav-user"
import { useAppStore } from "@/store/useAppStore"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { getMenuList } from "@/lib/menu-list"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()
    const { user } = useAppStore()
    const menuList = getMenuList(pathname, user)

    // Separate main navigation from settings
    const mainMenus = menuList.filter((group) => group.groupLabel !== "Settings")
    const settingsMenus = menuList.find((group) => group.groupLabel === "Settings")

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="py-4 px-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent group-data-[state=collapsed]:justify-center transition-all">
                            <Link href="/monitors">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-foreground text-background shadow-sm transition-all duration-200">
                                    <TowerControl className="size-5 shrink-0" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight group-data-[state=collapsed]:hidden ml-2">
                                    <span className="truncate font-bold text-foreground">Beacn</span>
                                    <span className="truncate text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Status Console</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {mainMenus.map((group, index) => (
                    <SidebarGroup key={index} className="py-2">
                        {group.groupLabel && (
                            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 mb-1">
                                {group.groupLabel}
                            </SidebarGroupLabel>
                        )}
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.menus.map((item) => {
                                    const isActive = item.active
                                    const Icon = item.icon

                                    if (item.submenus && item.submenus.length > 0) {
                                        return (
                                            <Collapsible
                                                key={item.label}
                                                asChild
                                                defaultOpen={isActive}
                                                className="group/collapsible"
                                            >
                                                <SidebarMenuItem>
                                                    <CollapsibleTrigger asChild>
                                                        <SidebarMenuButton tooltip={item.label} isActive={isActive} className="rounded-md transition-all duration-200">
                                                            {Icon && <Icon className="size-4 shrink-0" />}
                                                            <span className="font-medium group-data-[collapsible=icon]:hidden">{item.label}</span>
                                                            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                                                        </SidebarMenuButton>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <SidebarMenuSub className="ml-4 border-l border-border/50">
                                                            {item.submenus.map((subItem) => (
                                                                <SidebarMenuSubItem key={subItem.label}>
                                                                    <SidebarMenuSubButton
                                                                        asChild
                                                                        isActive={subItem.active}
                                                                        className="rounded-md"
                                                                    >
                                                                        <Link href={subItem.href}>
                                                                            <span>{subItem.label}</span>
                                                                        </Link>
                                                                    </SidebarMenuSubButton>
                                                                </SidebarMenuSubItem>
                                                            ))}
                                                        </SidebarMenuSub>
                                                    </CollapsibleContent>
                                                </SidebarMenuItem>
                                            </Collapsible>
                                        )
                                    }

                                    return (
                                        <SidebarMenuItem key={item.label}>
                                            <SidebarMenuButton
                                                asChild={!item.disabled}
                                                isActive={isActive}
                                                tooltip={item.label}
                                                className={`rounded-md transition-all duration-200 ${item.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                                            >
                                                {item.disabled ? (
                                                    <>
                                                        {Icon && <Icon className="size-4 shrink-0" />}
                                                        <span className="font-medium group-data-[collapsible=icon]:hidden">{item.label}</span>
                                                        <SidebarMenuBadge className="text-[9px] bg-muted rounded px-1 py-0.5 group-data-[collapsible=icon]:hidden uppercase font-bold tracking-tighter">Soon</SidebarMenuBadge>
                                                    </>
                                                ) : (
                                                    <Link href={item.href}>
                                                        {Icon && <Icon className="size-4 shrink-0" />}
                                                        <span className="font-medium group-data-[collapsible=icon]:hidden">{item.label}</span>
                                                    </Link>
                                                )}
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}

                {settingsMenus && (
                    <SidebarGroup className="mt-auto py-2">
                        <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 mb-1">
                            {settingsMenus.groupLabel}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {settingsMenus.menus.map((item) => {
                                    const isActive = item.active
                                    const Icon = item.icon
                                    return (
                                        <SidebarMenuItem key={item.label}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                                tooltip={item.label}
                                                className="rounded-md transition-all duration-200"
                                            >
                                                <Link href={item.href}>
                                                    {Icon && <Icon className="size-4 shrink-0" />}
                                                    <span className="font-medium group-data-[collapsible=icon]:hidden">{item.label}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <SidebarFooter className="p-2 border-t border-border/50">
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
