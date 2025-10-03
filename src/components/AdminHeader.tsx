'use client';
import React, { useState } from "react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminHeader() {
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch {}
    // Clear session cookie on server
    await fetch('/api/auth/logout', { method: 'POST' });
    // Redirect to login
    window.location.href = "/login";
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-ug-primary text-white shadow-md w-full">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="https://ext.same-assets.com/3971048018/2586777727.png" alt="Logo" className="h-9 w-9 rounded-full" />
          <span className="text-lg font-bold tracking-tight">Undergraduation Admin</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-white/90 hover:text-white">Dashboard</Link>
          <Link href="/student" className="text-white/90 hover:text-white">Students</Link>
          <Link href="/colleges" className="text-white/90 hover:text-white">Colleges</Link>
          <Link href="#" className="text-white/90 hover:text-white">Essays</Link>
          <button
            onClick={handleLogout}
            className="ml-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-1.5 text-sm"
          >
            Log out
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 border border-white/20"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <span className="sr-only">Open menu</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
            <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Mobile sidebar */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-ug-primary text-white shadow-xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="https://ext.same-assets.com/3971048018/2586777727.png" alt="Logo" className="h-8 w-8 rounded-full" />
                <span className="font-semibold">Menu</span>
              </div>
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="p-2 rounded-lg bg-white/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <Link href="/dashboard" onClick={() => setOpen(false)} className="text-white/90 hover:text-white">Dashboard</Link>
            <Link href="/student" onClick={() => setOpen(false)} className="text-white/90 hover:text-white">Students</Link>
            <Link href="/colleges" onClick={() => setOpen(false)} className="text-white/90 hover:text-white">Colleges</Link>
            <Link href="#" onClick={() => setOpen(false)} className="text-white/90 hover:text-white">Essays</Link>
            <button
              onClick={handleLogout}
              className="mt-auto bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-3 py-2 text-sm text-left"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
