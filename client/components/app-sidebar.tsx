"use client"

import {
    ChevronRight,
    TowerControl
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { NavUser } from "@/components/nav-user"
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
    const menuList = getMenuList(pathname)

    // Separate main navigation from settings
    const mainMenus = menuList.filter((group) => group.groupLabel !== "Settings")
    const settingsMenus = menuList.find((group) => group.groupLabel === "Settings")

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="p-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="rounded-xl hover:bg-sidebar-accent">
                            <Link href="/monitors">
                                <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dim text-white shadow-sm shadow-primary/20">
                                    <TowerControl className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-bold text-sidebar-foreground">Beacn</span>
                                    <span className="truncate text-[11px] text-sidebar-foreground/50">Monitoring</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarSeparator className="mx-3" />

            <SidebarContent className="pt-1">
                {mainMenus.map((group, index) => (
                    <SidebarGroup key={index} className="px-3 py-1">
                        {group.groupLabel && (
                            <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-widest text-sidebar-foreground/40 px-2 mb-0.5">
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
                                                        <SidebarMenuButton tooltip={item.label} isActive={isActive} className="rounded-lg">
                                                            {Icon && <Icon className="size-4" />}
                                                            <span className="font-medium">{item.label}</span>
                                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                        </SidebarMenuButton>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <SidebarMenuSub>
                                                            {item.submenus.map((subItem) => (
                                                                <SidebarMenuSubItem key={subItem.label}>
                                                                    <SidebarMenuSubButton
                                                                        asChild
                                                                        isActive={subItem.active}
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
                                                className={`rounded-lg ${item.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                                            >
                                                {item.disabled ? (
                                                    <>
                                                        {Icon && <Icon className="size-4" />}
                                                        <span className="font-medium">{item.label}</span>
                                                        <SidebarMenuBadge className="text-[10px] bg-surface-container-high rounded-md px-1.5 py-0.5">Soon</SidebarMenuBadge>
                                                    </>
                                                ) : (
                                                    <Link href={item.href}>
                                                        {Icon && <Icon className="size-4" />}
                                                        <span className="font-medium">{item.label}</span>
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
                    <SidebarGroup className="mt-auto px-3 py-1">
                        <SidebarSeparator className="mb-2" />
                        <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-widest text-sidebar-foreground/40 px-2 mb-0.5">
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
                                                className="rounded-lg"
                                            >
                                                <Link href={item.href}>
                                                    {Icon && <Icon className="size-4" />}
                                                    <span className="font-medium">{item.label}</span>
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
            <SidebarFooter className="p-3">
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
