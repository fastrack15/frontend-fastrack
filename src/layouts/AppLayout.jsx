import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useSidebar from "../hooks/useSidebar";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

function AppLayout() {
  const location = useLocation();
  const token = localStorage.getItem("auth_token");
  const { mobileOpen, toggle, closeMobile } = useSidebar();

  // Perlindungan halaman di sisi frontend. Backend tetap menjadi
  // pengaman utama melalui middleware JWT.
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="min-h-screen">
      <Sidebar onNavigate={closeMobile} />

      <div
        className="fixed inset-0 z-30 hidden bg-gray-900/50 sb-open:max-lg:block"
        aria-hidden="true"
        onClick={closeMobile}
      />

      <div className="flex min-h-screen flex-col transition-[padding] duration-300 lg:pl-[290px] sb-collapsed:lg:pl-[90px]">
        <Navbar onToggle={toggle} mobileOpen={mobileOpen} />

        <main id="main-content" className="min-w-0 flex-1 p-4 md:p-6">
          <Suspense
            fallback={
              <p className="text-sm text-gray-500">Memuat halaman...</p>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
