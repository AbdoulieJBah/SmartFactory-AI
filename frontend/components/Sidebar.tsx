"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  BellRing,
  Bot,
  Boxes,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Clock,
  Factory,
  FileClock,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
  Wrench,
} from "lucide-react";
import { logout } from "../app/lib/auth";
import { api } from "../app/lib/api";

type Role =
  | "Super Admin"
  | "Company Admin"
  | "Plant Manager"
  | "Production Manager"
  | "Quality Manager"
  | "Warehouse Manager"
  | "Operator"
  | "Viewer";

type NavLink = {
  name: string;
  href: string;
  icon: any;
  roles: Role[];
};

type NavSection = {
  title: string;
  links: NavLink[];
};

const allRoles: Role[] = [
  "Super Admin",
  "Company Admin",
  "Plant Manager",
  "Production Manager",
  "Quality Manager",
  "Warehouse Manager",
  "Operator",
  "Viewer",
];

const adminRoles: Role[] = ["Super Admin", "Company Admin"];

const managerRoles: Role[] = [
  "Super Admin",
  "Company Admin",
  "Plant Manager",
];

const productionRoles: Role[] = [
  "Super Admin",
  "Company Admin",
  "Plant Manager",
  "Production Manager",
  "Operator",
];

const qualityRoles: Role[] = [
  "Super Admin",
  "Company Admin",
  "Plant Manager",
  "Quality Manager",
];

const warehouseRoles: Role[] = [
  "Super Admin",
  "Company Admin",
  "Plant Manager",
  "Warehouse Manager",
];

const navSections: NavSection[] = [
  {
    title: "Overview",
    links: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: allRoles },
      { name: "Analytics", href: "/analytics", icon: BarChart3, roles: managerRoles },
      { name: "AI Copilot", href: "/ai", icon: Bot, roles: managerRoles },
      { name: "Reports", href: "/reports", icon: FileText, roles: allRoles },
      { name: "Alerts", href: "/alerts", icon: BellRing, roles: allRoles },
      { name: "Notifications", href: "/notifications", icon: Bell, roles: allRoles },
      { name: "Forecasting", href: "/forecasting", icon: TrendingUp, roles: allRoles },
    ],
  },
  {
    title: "Administration",
    links: [
      { name: "Users", href: "/users", icon: ShieldCheck, roles: adminRoles },
      { name: "Audit Logs", href: "/audit-logs", icon: FileClock, roles: adminRoles },
      { name: "Companies", href: "/companies", icon: Building2, roles: adminRoles },
      { name: "Company Settings", href: "/company-settings", icon: Settings, roles: adminRoles },
    ],
  },
  {
    title: "Manufacturing MES",
    links: [
      { name: "OEE Dashboard", href: "/oee", icon: Gauge, roles: allRoles },
      { name: "Scheduling", href: "/scheduling", icon: CalendarDays, roles: productionRoles },
      { name: "Production Orders", href: "/production-orders", icon: Factory, roles: productionRoles },
      { name: "Work Centers", href: "/work-centers", icon: Wrench, roles: productionRoles },
      { name: "Maintenance", href: "/maintenance", icon: Wrench, roles: managerRoles },
      { name: "Quality Control", href: "/quality", icon: ClipboardCheck, roles: qualityRoles },
      { name: "Traceability", href: "/traceability", icon: Boxes, roles: managerRoles },
      { name: "Downtime", href: "/downtime", icon: Clock, roles: productionRoles },
      { name: "Waste Tracking", href: "/waste", icon: Boxes, roles: productionRoles },
    ],
  },
  {
    title: "ERP",
    links: [
      { name: "Products", href: "/products", icon: Package, roles: warehouseRoles },
      { name: "Inventory", href: "/inventory", icon: Warehouse, roles: warehouseRoles },
      { name: "Suppliers", href: "/suppliers", icon: Truck, roles: warehouseRoles },
      { name: "Customers", href: "/customers", icon: Users, roles: managerRoles },
      { name: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart, roles: warehouseRoles },
      { name: "Sales Orders", href: "/sales-orders", icon: Store, roles: managerRoles },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<Role>("Viewer");
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await api.get("/users/me");

        setUserRole(response.data.role || "Viewer");
        setUserName(response.data.full_name || "User");
      } catch {
        setUserRole("Viewer");
        setUserName("User");
      }
    };

    fetchCurrentUser();
  }, []);

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      links: section.links.filter((link) => link.roles.includes(userRole)),
    }))
    .filter((section) => section.links.length > 0);

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-slate-950 text-white shadow-xl">
      <div className="shrink-0 border-b border-slate-800 p-6">
        <h1 className="text-2xl font-bold">SmartFactory AI</h1>
        <p className="mt-1 text-xs text-slate-400">
          Intelligent MES & ERP Platform
        </p>
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto p-5 pb-10">
        {visibleSections.map((section) => (
          <div key={section.title}>
            <h2 className="mb-3 px-2 text-xs uppercase tracking-wider text-slate-500">
              {section.title}
            </h2>

            <div className="space-y-1">
              {section.links.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));

                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-slate-800 p-5">
        <div className="space-y-3 rounded-xl bg-slate-900 p-4">
          <div>
            <p className="text-sm font-semibold">{userName}</p>
            <p className="text-xs text-slate-400">{userRole}</p>
            <p className="mt-2 text-xs text-blue-400">SmartFactory AI v1.0</p>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}