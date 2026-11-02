// Sidebar: hanya satu menu. Dashboard dan Peta berada di bawah "Defect List",
// jadi menu ini tetap aktif di kedua halaman (lihat matchPaths).
export const MENU = [
  {
    label: "Defect List",
    to: "/defects/dashboard",
    icon: "fa-solid fa-road-barrier",
    matchPaths: ["/defects/dashboard", "/defects/map"],
  },
];

// Tombol halaman pada navbar. `end: true` agar "/" tidak ikut aktif di "/defects".
export const PAGE_TABS = [
  {
    label: "Dashboard",
    to: "/defects/dashboard",
    icon: "fa-solid fa-table-columns",
    end: true,
  },
  {
    label: "Peta Defect",
    to: "/defects/map",
    icon: "fa-solid fa-map-location-dot",
  },
];
