"use client";

import Link from "next/link";
import { viewerRoutes } from "../app/lib/viewer-routes";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../app/context/AuthContext";

const publicRoutes = ["/login"];

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { authenticated, loading, user } = useAuth();

  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (!loading && !authenticated && !isPublicRoute) {
      router.replace("/login");
    }

    if (!loading && authenticated && pathname === "/login") {
      router.replace("/");
    }
  }, [authenticated, loading, isPublicRoute, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading SmartFactory AI...
      </div>
    );
  }

  if (!authenticated && !isPublicRoute) {
    return null;
  }

  if (user?.role === "Viewer" && !isPublicRoute && !viewerRoutes.has(pathname)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 p-8 text-white">
        <h1 className="text-2xl font-bold">Read-only access</h1>
        <p>This page requires a staff account. You can still explore the dashboard and reports.</p>
        <Link className="rounded-lg bg-blue-600 px-5 py-3" href="/">Return to dashboard</Link>
      </main>
    );
  }
  return <>{children}</>;
}