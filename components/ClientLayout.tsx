"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { EducationProvider } from "@/components/EducationContext";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <EducationProvider>
      {!isAdmin && <Navbar />}
      <main className={isAdmin ? "" : "flex-1"}>{children}</main>
      {!isAdmin && <Footer />}
    </EducationProvider>
  );
}
