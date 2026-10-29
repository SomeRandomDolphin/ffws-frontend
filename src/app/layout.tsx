import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import "./map-dashboard.css";
import "./design-system.css";
import { withBasePath } from "@/lib/base-path";

export const metadata: Metadata = {
  title: "ITS Water Dashboard",
  description: "Dashboard simulasi muka air DAS Welang",
  icons: { icon: withBasePath("/favicon.png") },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
