"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  BookOpen,
  LayoutDashboard,
  Users,
  ListTodo,
  Building2,
  ScrollText,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** segment de pathname qui active ce lien */
  segment: string;
  /** rôles autorisés à voir ce lien — absent = visible par tous */
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/chat",
    label: "Chat",
    icon: <MessageSquare size={16} strokeWidth={1.75} />,
    segment: "chat",
  },
  {
    href: "/library",
    label: "Bibliothèque",
    icon: <BookOpen size={16} strokeWidth={1.75} />,
    segment: "library",
  },
  {
    href: "/tasks",
    label: "Mes tâches",
    icon: <ListTodo size={16} strokeWidth={1.75} />,
    segment: "tasks",
  },
  {
    href: "/admin",
    label: "Administration",
    icon: <LayoutDashboard size={16} strokeWidth={1.75} />,
    segment: "admin",
    roles: ["admin", "group_admin"],
  },
  {
    href: "/admin/users",
    label: "Collaborateurs",
    icon: <Users size={16} strokeWidth={1.75} />,
    segment: "admin/users",
    roles: ["admin", "group_admin"],
  },
  {
    href: "/group",
    label: "Groupe",
    icon: <Building2 size={16} strokeWidth={1.75} />,
    segment: "group",
    roles: ["group_admin"],
  },
  {
    href: "/group/audit",
    label: "Journal d'audit",
    icon: <ScrollText size={16} strokeWidth={1.75} />,
    segment: "group/audit",
    roles: ["group_admin"],
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  return (
    <nav aria-label="Navigation principale">
      <ul className="space-y-0.5" role="list">
        {visibleItems.map((item) => {
          const isActive =
            item.segment === "admin"
              ? pathname === "/admin"
              : pathname.startsWith(`/${item.segment}`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex items-center justify-center sm:justify-start sm:gap-2.5 px-0 sm:px-3 py-2 rounded-md text-sm zen-transition w-full",
                  "focus-visible:outline-2 focus-visible:outline-sapin focus-visible:outline-offset-1",
                  isActive
                    ? "bg-white text-graphite font-medium shadow-[0_1px_3px_rgba(28,35,33,0.08)]"
                    : "text-text-secondary hover:text-graphite hover:bg-white/50",
                ].join(" ")}
              >
                <span
                  className={isActive ? "text-sapin" : ""}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
