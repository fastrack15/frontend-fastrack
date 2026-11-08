import api from "../api";

export async function login({ username, password }) {
  const { data } = await api.post("/auth/login", { username, password });

  // Backend mengirim token dan user langsung di root response,
  // bukan di dalam properti data.data.
  if (data.success !== true || !data.token || !data.user) {
    throw new Error(data.message || "Respons login dari server tidak valid.");
  }

  return {
    token: data.token,
    user: data.user,
  };
}

export function logout() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
}

export function getStoredUser() {
  try {
    const user = localStorage.getItem("auth_user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}
