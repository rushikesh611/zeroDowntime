import {
  Bell,
  Globe,
  Logs,
  LucideIcon,
  Radio,
  ShieldAlert,
  Users
} from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
  icon?: LucideIcon;
};

type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
  disabled?: boolean;
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string, user: any): Group[] {
  const isFree = user?.plan === 'FREE';

  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/monitors",
          label: "Monitors",
          active: pathname.includes("/monitors"),
          icon: Globe,
          submenus: []
        }
      ]
    },
    {
      groupLabel: "",
      menus: [
        {
          href: "/statuspage",
          label: "Status Pages",
          active: pathname.startsWith("/statuspage") || pathname.startsWith("/s/"),
          icon: Radio,
          submenus: [],
          disabled: false
        }
      ]
    },
    {
      groupLabel: "",
      menus: [
        {
          href: "/incidents",
          label: "Incidents",
          active: pathname.startsWith("/incidents"),
          icon: ShieldAlert,
          submenus: [],
          disabled: false
        }
      ]
    },
    {
      groupLabel: "",
      menus: [
        {
          href: "/logtail/sources",
          label: "Logtail",
          active: pathname.includes("/logtail"),
          icon: Logs,
          disabled: true
        }
      ]
    }, {
      groupLabel: "",
      menus: [
        {
          href: "/notifications",
          label: "Notifications",
          active: pathname.includes("/notifications"),
          icon: Bell,
          submenus: [],
          disabled: false
        }
      ]
    },
    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/team",
          label: "Teams",
          active: pathname.includes("/team"),
          icon: Users,
          submenus: [],
          disabled: isFree
        }
      ]
    }
  ];
}