import { useCallback, useEffect, useState } from "react";

// Sama dengan MOBILE_BP di JS template CoolAdmin.
const MOBILE_BREAKPOINT = 992;

export default function useSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("sidebar-open", mobileOpen);
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    return () => {
      document.body.classList.remove("sidebar-open", "sidebar-collapsed");
    };
  }, [mobileOpen, collapsed]);

  // Tutup drawer dengan tombol Esc, dan saat layar membesar ke desktop.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) setMobileOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const toggle = useCallback(() => {
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      setMobileOpen((open) => !open);
    } else {
      setCollapsed((value) => !value);
    }
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return { mobileOpen, toggle, closeMobile };
}
