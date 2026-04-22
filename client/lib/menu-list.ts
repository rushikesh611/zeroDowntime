import {
  Bell,
  CreditCard,
  Database,
  Globe,
  Logs,
  LucideIcon,
  Radio,
  Search,
  Settings,
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
          label: "Status pages",
          active: pathname.includes("/statuspage"),
          icon: Radio,
          submenus: [],
          disabled: true
        }
      ]
    },
    {
      groupLabel: "",
      menus: [
        {
          href: "/incidents",
          label: "Incidents",
          active: pathname.includes("/incidents"),
          icon: ShieldAlert,
          submenus: [],
          disabled: true
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