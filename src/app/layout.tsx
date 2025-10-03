'use client';
import AdminHeader from "@/components/AdminHeader";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-ug-bg via-white to-ug-bg font-sans antialiased">
        {/* App Header */}
        <AdminHeader />
        {/* Page Container */}
        <main className="max-w-7xl mx-auto px-6 pt-28 pb-12 space-y-8">
          {children}
        </main>
      </body>
    </html>
  );
}
