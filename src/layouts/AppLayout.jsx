import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import useSidebar from "../hooks/useSidebar";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

function AppLayout() {
  const { mobileOpen, toggle, closeMobile } = useSidebar();

  return (
    <div className="min-h-screen">
      <Sidebar onNavigate={closeMobile} />

      {/* Latar gelap saat drawer terbuka di layar kecil. Diatur lewat
          body.sidebar-open (dipasang oleh useSidebar). */}
      <div
        className="fixed inset-0 z-30 hidden bg-gray-900/50 sb-open:max-lg:block"
        aria-hidden="true"
        onClick={closeMobile}
      />

      <div className="flex min-h-screen flex-col transition-[padding] duration-300 lg:pl-[290px] sb-collapsed:lg:pl-[90px]">
        <Navbar onToggle={toggle} mobileOpen={mobileOpen} />

        <main id="main-content" className="min-w-0 flex-1 p-4 md:p-6">
          <Suspense
            fallback={<p className="text-sm text-gray-500">Memuat halaman...</p>}
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
