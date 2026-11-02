const API_BASE_URL = import.meta.env.VITE_API_URL;

export function getPhotoUrl(path) {
  if (!path) return null;

  // Jika backend sudah memberikan URL lengkap, gunakan langsung.
  if (/^https?:\/\//i.test(path)) return path;

  // Hindari prefix /uploads ganda.
  const normalizedPath = path.startsWith("/uploads/")
    ? path
    : `/uploads/${path.replace(/^\/+/, "")}`;

  return `${API_BASE_URL}${normalizedPath}`;
}
