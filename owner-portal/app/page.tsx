"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const u = getUser();
    if (u?.role?.name === "OwnerPortal") {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="op-spinner" />
    </div>
  );
}
