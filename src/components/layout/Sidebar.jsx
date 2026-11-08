import { useState } from "react";
import { Link, matchPath, useLocation, useNavigate } from "react-router-dom";
import { MENU } from "./menuItems";
import logoMark from "../../assets/icon.png";
import logoText from "../../assets/logo-ft.png";
import { logout } from "../../services/authServices";

function useIsActive() {
  const { pathname } = useLocation();
  // "/" hanya aktif jika persis "/", bukan untuk semua URL.
  return (to) => Boolean(matchPath({ path: to, end: to === "/" }, pathname));
}

const itemBase =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/25 sb-collapsed:lg:justify-center sb-collapsed:lg:px-0";
const itemActive = "bg-brand-50 text-brand-600";
const itemIdle = "text-gray-700 hover:bg-gray-100";

function SidebarLink({ item, onNavigate }) {
  const isActive = useIsActive();
  // Menu aktif di semua path yang tercantum di matchPaths (mis. "/" dan "/defects").
  const active = (item.matchPaths ?? [item.to]).some(isActive);

  return (
    <li>
      <Link
        to={item.to}
        onClick={onNavigate}
        title={item.label}
        aria-current={active ? "page" : undefined}
        className={`${itemBase} ${active ? itemActive : itemIdle}`}
      >
        <i className={`${item.icon} w-5 shrink-0 text-center text-base`} />
        <span className="sb-collapsed:lg:hidden">{item.label}</span>
      </Link>
    </li>
  );
}

// Menu dengan submenu: daftar anak ditampilkan lewat state `open`.
function SidebarGroup({ item, onNavigate }) {
  const isActive = useIsActive();
  const childActive = item.children.some((child) => isActive(child.to));
  const [open, setOpen] = useState(childActive);

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        title={item.label}
        className={`${itemBase} w-full ${childActive ? itemActive : itemIdle}`}
        onClick={() => setOpen((value) => !value)}
      >
        <i className={`${item.icon} w-5 shrink-0 text-center text-base`} />
        <span className="flex-1 text-left sb-collapsed:lg:hidden">
          {item.label}
        </span>
        <i
          className={`fa-solid fa-chevron-down text-xs transition-transform sb-collapsed:lg:hidden ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      <ul
        className={`mt-1 flex-col gap-1 pl-9 sb-collapsed:lg:hidden ${
          open ? "flex" : "hidden"
        }`}
      >
        {item.children.map((child) => (
          <li key={child.to}>
            <Link
              to={child.to}
              onClick={onNavigate}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive(child.to) ? itemActive : itemIdle
              }`}
            >
              {child.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

function Sidebar({ onNavigate }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      id="main-sidebar"
      className="fixed inset-y-0 left-0 z-40 flex w-72.5 max-w-[85vw] -translate-x-full flex-col border-r border-gray-200 bg-white transition-[transform,width] duration-300 ease-in-out sb-open:translate-x-0 sb-open:shadow-theme-lg lg:translate-x-0 lg:shadow-none sb-collapsed:lg:w-22.5"
    >
      <div className="flex h-16 items-center justify-between gap-2 border-b border-gray-200 px-5 sb-collapsed:lg:justify-center sb-collapsed:lg:px-0">
        <Link
          className="flex min-w-0 items-center gap-3 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/25"
          to="/"
          aria-label="Beranda"
          onClick={onNavigate}
        >
          <img
            src={logoMark}
            alt=""
            className="size-9 shrink-0 object-contain"
          />
          <img
            src={logoText}
            alt="Defect Monitor"
            className="h-8 w-auto max-w-40 object-contain sb-collapsed:lg:hidden"
          />
        </Link>

        {/* Tombol tutup, hanya tampil di layar kecil */}
        <button
          className="inline-flex size-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/25 lg:hidden"
          type="button"
          aria-label="Tutup navigasi"
          onClick={onNavigate}
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sb-collapsed:lg:px-3">
        <ul className="flex flex-col gap-1">
          {MENU.map((item) => (
            <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </ul>
      </nav>

      <div className="mt-auto border-t border-gray-200 px-4 py-4 sb-collapsed:lg:px-3">
        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          className={`${itemBase} w-full text-red-600 hover:bg-red-50 hover:text-red-700`}
        >
          <i
            className="fa-solid fa-right-from-bracket w-5 shrink-0 text-center text-base"
            aria-hidden="true"
          />
          <span className="sb-collapsed:lg:hidden">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
