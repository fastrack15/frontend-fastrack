import api from "../api";

// Hapus lunak: backend hanya menandai delete_data = 1 (baris tetap ada di database).
export async function deleteDefect(dataId) {
  const { data } = await api.put(
    `/defects/${encodeURIComponent(dataId)}/delete`,
  );

  if (data.success !== true) {
    throw new Error(data.message || "Gagal menghapus data.");
  }

  return data.data;
}
