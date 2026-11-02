import api from "../api";

// export async function getDashboardStats(signal) {
//   const { data } = await api.get("/dashboard/stats", { signal });
//   if (!data.success) throw new Error("Respons statistik tidak valid");
//   return data.stats;
// }

export async function getDefects(signal) {
  const { data } = await api.get("/dashboard/defects", { signal });
  return data.data ?? [];
}

export async function saveDefectLocation(dataId, coordinates) {
  const { data } = await api.put(
    `/defects/${encodeURIComponent(dataId)}/location`,
    {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    },
  );
  if (data.success !== true)
    throw new Error(data.message || "Gagal Menyimpan Data");
  return data.data;
}
