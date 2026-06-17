import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Payroll Management System",
  description: "Multi-tenant payroll management for India"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
