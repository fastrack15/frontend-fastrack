import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { PAGE_TABS } from "./menuItems";
import { btnIcon } from "../ui/styles";
import { getStoredUser, logout } from "../../services/authServices";

function Navbar({ onToggle, mobileOpen }) {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

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

        <div className="ml-auto flex items-center gap-3">
          {user && (
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-800">
                {user.fullname || user.username}
              </p>
              <p className="text-xs capitalize text-gray-500">{user.role}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/25"
          >
            <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
