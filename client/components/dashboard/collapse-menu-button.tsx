"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, LucideIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip";

interface CollapseMenuButtonProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  submenus?: {
    href: string;
    label: string;
    icon?: LucideIcon; // Make sure icon is included in submenu type
    active?: boolean;
  }[];
  isOpen: boolean | undefined;
}

export function CollapseMenuButton({
  icon: Icon,
  label,
  active,
  submenus,
  isOpen
}: CollapseMenuButtonProps) {
  const [open, setOpen] = useState(active);

  return (
    <div className="flex flex-col w-full">
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <Button
              variant={active ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-between h-10 mb-1",
                active && "bg-primary/10"
              )}
              onClick={() => setOpen(!open)}
            >
              <div className="flex items-center">
                <span className={cn(isOpen === false ? "" : "mr-4")}>
                  <Icon size={18} />
                </span>
                <p
                  className={cn(
                    "max-w-[200px] truncate",
                    isOpen === false
                      ? "-translate-x-96 opacity-0"
                      : "translate-x-0 opacity-100"
                  )} 
                >
                  {label}
                </p>
              </div>

              <div
                className={cn(
                  "transition-transform",
                  isOpen === false ? "opacity-0" : "opacity-100",
                  open && "rotate-90"
                )}
              >
                <ChevronRight size={16} />
              </div>
            </Button>
          </TooltipTrigger>

          {isOpen === false && (
            <TooltipContent side="right">{label}</TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      {/* Submenu items */}
      {open && submenus && submenus.length > 0 && (
        <div
          className={cn(
            "pl-6 flex flex-col space-y-1 mb-1",
            isOpen === false ? "hidden" : "block"
          )}
        >
          {submenus.map(({ href, label, icon: SubIcon, active }, index) => (
            <TooltipProvider key={index} disableHoverableContent>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    className="w-full justify-start h-10"
                    asChild
                  >
                    <Link href={href} className="flex items-center">
                      {/* Show submenu icon if available - UPDATED FOR ALIGNMENT */}
                      {SubIcon && (
                        <span className={cn(
                          "flex items-center justify-center",
                          isOpen === false ? "" : "mr-4"
                        )}>
                          <SubIcon size={16} />
                        </span>
                      )}
                      {/* If no icon, add indentation for alignment */}
                      {!SubIcon && isOpen !== false && (
                        <span className="w-[16px] mr-4"></span>
                      )}
                      <p
                        className={cn(
                          "max-w-[180px] truncate",
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
                  <TooltipContent side="right">{label}</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}
    </div>
  );
}