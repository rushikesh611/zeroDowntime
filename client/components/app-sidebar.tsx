"use client"

import * as React from "react"
import {
    ChevronRight,
    Zap,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

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
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuBadge,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { getMenuList } from "@/lib/menu-list"
import { NavUser } from "@/components/nav-user"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()
    const menuList = getMenuList(pathname)

    // Separate main navigation from settings
    const mainMenus = menuList.filter((group) => group.groupLabel !== "Settings")
    const settingsMenus = menuList.find((group) => group.groupLabel === "Settings")

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/monitors">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Zap className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">ZeroDowntime</span>
                                    <span className="truncate text-xs">Monitoring that never sleeps!</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                {mainMenus.map((group, index) => (
                    <SidebarGroup key={index}>
                        {group.groupLabel && (
                            <SidebarGroupLabel>{group.groupLabel}</SidebarGroupLabel>
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
                                                        <SidebarMenuButton tooltip={item.label} isActive={isActive}>
                                                            {Icon && <Icon />}
                                                            <span>{item.label}</span>
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
                                                className={item.disabled ? "opacity-50 cursor-not-allowed" : ""}
                                            >
                                                {item.disabled ? (
                                                    <>
                                                        {Icon && <Icon />}
                                                        <span>{item.label}</span>
                                                        <SidebarMenuBadge>Soon</SidebarMenuBadge>
                                                    </>
                                                ) : (
                                                    <Link href={item.href}>
                                                        {Icon && <Icon />}
                                                        <span>{item.label}</span>
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
                        <SidebarGroupLabel>{settingsMenus.groupLabel}</SidebarGroupLabel>
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
                                            >
                                                <Link href={item.href}>
                                                    {Icon && <Icon />}
                                                    <span>{item.label}</span>
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
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
