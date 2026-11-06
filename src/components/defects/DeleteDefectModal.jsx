import { useState } from "react";
import Modal, { ModalBody, ModalFooter } from "../ui/Modal";
import { alertError, btnDanger, btnOutline } from "../ui/styles";
import { deleteDefect } from "../../services/defectServices";

const capitalise = (value) => {
  const text = String(value ?? "").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "-";
};

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="wrap-anywhere text-sm font-medium text-gray-800">
        {children}
      </dd>
    </div>
  );
}

// Konfirmasi hapus. Dipasang hanya saat ada data yang akan dihapus, sehingga
// status (loading, pesan galat) selalu bersih setiap kali dibuka.
function DeleteDefectModal({ defect, lokasi, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Selama proses hapus berjalan, modal tidak boleh ditutup.
  const close = () => {
    if (!deleting) onClose();
  };

  const handleDelete = async () => {
    if (deleting) return;

    setDeleting(true);
    setError("");

    try {
      await deleteDefect(defect.data_id);
      onDeleted(defect);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Gagal menghapus data. Silakan coba lagi.",
      );
      setDeleting(false);
    }
  };

  return (
    <Modal
      size="md"
      labelledBy="deleteDefectTitle"
      onBackdropClick={close}
      onEscape={close}
    >
      <ModalBody>
        <div className="flex gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-error-50 text-error-600">
            <i className="fa-solid fa-trash-can" aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <h2
              id="deleteDefectTitle"
              className="text-lg font-semibold text-gray-800"
            >
              Hapus data defect?
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Data berikut akan dihapus dari daftar dan tidak bisa dipulihkan
              dari aplikasi ini.
            </p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <Field label="ID">{defect.data_id}</Field>
          <Field label="Lokasi">{lokasi || "-"}</Field>
          <Field label="Ruas">{defect.ruas || "-"}</Field>
          <Field label="Kegiatan">{defect.kegiatan || "-"}</Field>
          <Field label="Objek">{capitalise(defect.jenis_bangunan)}</Field>
          <Field label="Temuan">{capitalise(defect.temuan)}</Field>
        </dl>

        {error && (
          <div className={`${alertError} mt-4`} role="alert">
            {error}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {/* Fokus awal di "Batal" agar tidak terhapus karena menekan Enter. */}
        <button
          type="button"
          className={btnOutline}
          onClick={close}
          disabled={deleting}
          autoFocus
        >
          Batal
        </button>

        <button
          type="button"
          className={btnDanger}
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <>
              <span
                className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                aria-hidden="true"
              />
              Menghapus...
            </>
          ) : (
            "Ya, hapus"
          )}
        </button>
      </ModalFooter>
    </Modal>
  );
}

export default DeleteDefectModal;
