import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { PageTransition } from "@/components/layout/PageTransition";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background-primary flex">
      {/* Sidebar ocupa espaço físico no layout */}
      <div className="hidden lg:block w-[240px] shrink-0" aria-hidden="true" />

      {/* Sidebar fixada */}
      <Sidebar />

      {/* Coluna principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main
          className="flex-1 pt-16 pb-20 lg:pb-6"
          id="main-content"
        >
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>

      {/* Mobile nav */}
      <MobileNav />
    </div>
  );
}
