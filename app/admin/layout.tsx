"use client";

import React, { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Search, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar } from "@/components/ui";
import { AdminNotificationDropdown } from "@/components/admin/NotificationDropdown";
import { AdminGlobalSearch } from "@/components/admin/AdminGlobalSearch";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }

      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background-primary flex">
      {/* Sidebar space placeholder */}
      <div className="hidden lg:block w-[240px] shrink-0" aria-hidden="true" />

      {/* Fixed sidebar */}
      <AdminSidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Admin topbar */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-5 bg-background-secondary/90 backdrop-blur-md border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-accent-secondary" />
            <span className="text-sm font-semibold text-content-primary">
              Painel Admin
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-background-tertiary transition-colors"
              title="Pesquisar (Ctrl+K)"
            >
              <Search size={18} />
            </button>
            
            <AdminNotificationDropdown />

            <div className="flex items-center gap-2 pl-2 border-l border-border-subtle ml-1">
              <Avatar
                src={user?.avatar}
                name={user?.name || "Dr Marcelo"}
                size="sm"
                className="w-7 h-7"
              />
              <span className="text-xs font-medium text-content-primary hidden sm:block">
                {user?.name || "Dr. Marcelo"}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      <AdminGlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
