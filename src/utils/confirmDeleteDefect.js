import Swal from "sweetalert2";
import { deleteDefect } from "../services/defectServices";

// Menampilkan konfirmasi hapus dan, bila dikonfirmasi, menghapus data
// (hapus lunak di backend). Mengembalikan true hanya jika data berhasil dihapus.
// Jika server gagal, pesan galat tampil di dalam dialog dan dialog tetap terbuka.
export async function confirmDeleteDefect(defect) {
  const result = await Swal.fire({
    icon: "warning",
    title: "Hapus data defect?",
    html: `
      <p class="text-sm text-gray-600">
        Data berikut akan dihapus dari daftar dan tidak bisa dipulihkan dari aplikasi ini.
      </p>
     `,
    showCancelButton: true,
    confirmButtonText: "Ya, hapus",
    cancelButtonText: "Batal",
    confirmButtonColor: "#d92d20",
    reverseButtons: true,
    // Fokus awal di "Batal" agar tidak terhapus karena menekan Enter.
    focusCancel: true,
    showLoaderOnConfirm: true,
    allowOutsideClick: () => !Swal.isLoading(),
    allowEscapeKey: () => !Swal.isLoading(),
    preConfirm: async () => {
      try {
        await deleteDefect(defect.data_id);
        return true;
      } catch (error) {
        Swal.showValidationMessage(
          error.response?.data?.message ||
            error.message ||
            "Gagal menghapus data. Silakan coba lagi.",
        );
        return false; // dialog tetap terbuka
      }
    },
  });

  return result.isConfirmed;
}
