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
            <SidebarHeader className="transition-all duration-300">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="rounded-xl hover:bg-sidebar-accent group-data-[state=collapsed]:justify-center transition-all">
                            <Link href="/monitors">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dim text-white shadow-sm shadow-primary/20 transition-all duration-200">
                                    <TowerControl className="size-4 shrink-0" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight group-data-[state=collapsed]:hidden">
                                    <span className="truncate font-bold text-sidebar-foreground">Beacn</span>
                                    <span className="truncate text-[11px] text-sidebar-foreground/50">Monitoring</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarSeparator className="mx-3 group-data-[state=collapsed]:mx-2 transition-all duration-200" />

            <SidebarContent>
                {mainMenus.map((group, index) => (
                    <SidebarGroup key={index}>
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
                                                        <SidebarMenuButton tooltip={item.label} isActive={isActive} className="rounded-lg group-data-[state=collapsed]:justify-center transition-all duration-200">
                                                            {Icon && <Icon className="size-4 shrink-0" />}
                                                            <span className="font-medium group-data-[state=collapsed]:hidden">{item.label}</span>
                                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[state=collapsed]:hidden" />
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
                                                className={`rounded-lg group-data-[state=collapsed]:justify-center transition-all duration-200 ${item.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                                            >
                                                {item.disabled ? (
                                                    <>
                                                        {Icon && <Icon className="size-4 shrink-0" />}
                                                        <span className="font-medium group-data-[state=collapsed]:hidden">{item.label}</span>
                                                        <SidebarMenuBadge className="text-[10px] bg-surface-container-high rounded-md px-1.5 py-0.5 group-data-[state=collapsed]:hidden">Soon</SidebarMenuBadge>
                                                    </>
                                                ) : (
                                                    <Link href={item.href}>
                                                        {Icon && <Icon className="size-4 shrink-0" />}
                                                        <span className="font-medium group-data-[state=collapsed]:hidden">{item.label}</span>
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
                    <SidebarGroup className="mt-auto">
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
                                                className="rounded-lg group-data-[state=collapsed]:justify-center transition-all duration-200"
                                            >
                                                <Link href={item.href}>
                                                    {Icon && <Icon className="size-4 shrink-0" />}
                                                    <span className="font-medium group-data-[state=collapsed]:hidden">{item.label}</span>
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
            <SidebarFooter className="transition-all duration-300">
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
