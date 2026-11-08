import { useState } from "react";
import { NavLink } from "react-router-dom";
import { PAGE_TABS } from "./menuItems";
import { btnIcon } from "../ui/styles";
import { getStoredUser } from "../../services/authServices";

function Navbar({ onToggle, mobileOpen }) {
  const [user] = useState(() => getStoredUser());

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">
      <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-2 md:px-6">
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

        <div className="ml-auto flex min-w-0 items-center gap-2.5 rounded-full border border-gray-200 bg-white py-1 pl-1.5 pr-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <i className="fa-solid fa-user" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="max-w-40 truncate text-sm font-bold text-gray-800 sm:max-w-56">
              {user?.fullname ?? "User"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
