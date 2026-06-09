"use client";

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
  const { authenticated, loading } = useAuth();

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

  return <>{children}</>;
}