"use client";

import Link from "next/link";
import { Ellipsis, LogOut, Users, CreditCard, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { getMenuList } from "@/lib/menu-list";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollapseMenuButton } from "@/components/dashboard/collapse-menu-button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip";
import { useAppStore } from "@/store/useAppStore";

interface MenuProps {
  isOpen: boolean | undefined;
}

export function Menu({ isOpen }: MenuProps) {
  const pathname = usePathname();
  const menuList = getMenuList(pathname);
  const { logout } = useAppStore();

  // Separate main navigation from settings
  const mainMenus = menuList.filter(group => group.groupLabel !== "Settings");
  const settingsMenus = menuList.find(group => group.groupLabel === "Settings");

  return (
    <nav className="mt-6 w-full h-full flex flex-col">
      <div className="flex-1 px-2">
        <ul className="flex flex-col items-start space-y-1">
          {mainMenus.map(({ groupLabel, menus }, index) => (
            <li className={cn("w-full", groupLabel ? "pt-5" : "")} key={index}>
              {(isOpen && groupLabel) || isOpen === undefined ? (
                <p className="text-xs font-semibold text-muted-foreground px-4 pb-2 max-w-[248px] truncate uppercase tracking-wider">
                  {groupLabel}
                </p>
              ) : !isOpen && isOpen !== undefined && groupLabel ? (
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger className="w-full">
                      <div className="w-full flex justify-center items-center">
                        <Ellipsis className="h-5 w-5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{groupLabel}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <p className="pb-2"></p>
              )}
              {menus.map(
                ({ href, label, icon: Icon, active, submenus }, index) =>
                  !submenus || submenus.length === 0 ? (
                    <div className="w-full" key={index}>
                      <TooltipProvider disableHoverableContent>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={active ? "secondary" : "ghost"}
                              className={cn(
                                "w-full justify-start h-11 mb-1 transition-all duration-200",
                                active 
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" 
                                  : "hover:bg-accent hover:translate-x-1"
                              )}
                              asChild
                            >
                              <Link href={href}>
                                <span
                                  className={cn(
                                    "flex items-center justify-center",
                                    isOpen === false ? "" : "mr-3"
                                  )}
                                >
                                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                                </span>
                                <p
                                  className={cn(
                                    "font-medium text-sm transition-all duration-300",
                                    isOpen === false
                                      ? "-translate-x-96 opacity-0"
                                      : "translate-x-0 opacity-100"
                                  )}
                                >
                                  {label}
                                </p>
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          {isOpen === false && (
                            <TooltipContent side="right" className="font-medium">
                              {label}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ) : (
                    <div className="w-full" key={index}>
                      <CollapseMenuButton
                        icon={Icon}
                        label={label}
                        active={active}
                        submenus={submenus}
                        isOpen={isOpen}
                      />
                    </div>
                  )
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom Section - Settings */}
      <div className="mt-auto border-t pt-4 px-2 space-y-1">
        {settingsMenus?.menus.map(({ href, label, icon: Icon, active }, index) => (
          <TooltipProvider disableHoverableContent key={index}>
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-11 transition-all duration-200",
                    active 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm" 
                      : "hover:bg-accent hover:translate-x-1"
                  )}
                  asChild
                >
                  <Link href={href}>
                    <span className={cn("flex items-center justify-center", isOpen === false ? "" : "mr-3")}>
                      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                    </span>
                    <p
                      className={cn(
                        "font-medium text-sm transition-all duration-300",
                        isOpen === false ? "-translate-x-96 opacity-0" : "translate-x-0 opacity-100"
                      )}
                    >
                      {label}
                    </p>
                  </Link>
                </Button>
              </TooltipTrigger>
              {isOpen === false && (
                <TooltipContent side="right" className="font-medium">
                  {label}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ))}

        {/* Sign Out */}
        <TooltipProvider disableHoverableContent>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button
                onClick={logout}
                variant="ghost"
                className="w-full justify-start h-11 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-200"
              >
                <span className={cn("flex items-center justify-center", isOpen === false ? "" : "mr-3")}>
                  <LogOut size={20} />
                </span>
                <p
                  className={cn(
                    "font-medium text-sm transition-all duration-300",
                    isOpen === false ? "opacity-0 hidden" : "opacity-100"
                  )}
                >
                  Sign out
                </p>
              </Button>
            </TooltipTrigger>
            {isOpen === false && (
              <TooltipContent side="right" className="font-medium">
                Sign out
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </nav>
  );
}