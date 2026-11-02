import { NavLink } from "react-router-dom";
import { PAGE_TABS } from "./menuItems";
import { btnIcon } from "../ui/styles";

function Navbar({ onToggle, mobileOpen }) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <button
          className={btnIcon}
          type="button"
          aria-label="Buka atau tutup navigasi"
          aria-expanded={mobileOpen}
          aria-controls="main-sidebar"
          onClick={onToggle}
        >
          <i className="fa-solid fa-bars" aria-hidden="true" />
        </button>

        {/* Tombol halaman Defect List. NavLink menandai halaman aktif. */}
        <nav aria-label="Halaman Defect List" className="min-w-0">
          <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
            {PAGE_TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                aria-label={tab.label}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/25 ${
                    isActive
                      ? "bg-white text-gray-900 shadow-theme-xs"
                      : "text-gray-500 hover:text-gray-700"
                  }`
                }
              >
                <i className={tab.icon} aria-hidden="true" />
                <span className="hidden min-[360px]:inline">{tab.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Sisi kanan (nama pengguna, notifikasi) bisa ditambahkan di sini */}
      </div>
    </header>
  );
}

export default Navbar;
