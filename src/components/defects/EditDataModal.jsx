import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Modal, { ModalBody, ModalHeader } from "../ui/Modal";
import {
  btnOutline,
  btnPrimary,
  input,
  label as labelClass,
  textarea as textareaClass,
} from "../ui/styles";
import api from "../../api";

// Tombol Hapus: merah, dengan garis tepi, agar tidak tertukar dengan Simpan.
const deleteButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-error-200 bg-white px-4 text-sm font-medium text-error-600 transition-colors hover:bg-error-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-error-500/25 disabled:cursor-not-allowed disabled:opacity-50";

// Nilai "-" hanya penanda tampilan dari toDefectRow, bukan data asli.
// Jangan sampai ikut tersimpan ke database.
const clean = (value) => (value == null || value === "-" ? "" : value);

function FormField({ id, label, span = "sm:col-span-3", children }) {
  return (
    <div className={`col-span-1 ${span} min-w-0`}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function EditDataModal({ defect, onClose, onSaved, onDelete }) {
  const [target, setTarget] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [lingkup, setLingkup] = useState("");
  const [sublingkup, setSublingkup] = useState("");
  const [status, setStatus] = useState("");
  const [sta, setSta] = useState("");
  const [ruas, setRuas] = useState("");
  const [kegiatan, setKegiatan] = useState("");
  const [bangunan, setBangunan] = useState("");
  const [temuan, setTemuan] = useState("");
  const [rekomendasi, setRekomendasi] = useState("");
  const [lajur, setLajur] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTarget(defect?.target ?? "");
    setKeterangan(defect?.keterangan ?? "");
    setLingkup(clean(defect?.lingkup));
    setSublingkup(clean(defect?.sublingkup));
    setStatus(clean(defect?.status));
    setSta(defect?.sta ?? "");
    setRuas(defect?.ruas ?? "");
    setKegiatan(defect?.kegiatan ?? "");
    setBangunan(defect?.jenis_bangunan ?? "");
    setTemuan(defect?.temuan ?? "");
    setRekomendasi(defect?.rekomendasi ?? "");
    setLajur(clean(defect?.lajur));
    setError("");
  }, [defect]);

  if (!defect) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const dataId = defect.data_id;

      if (dataId == null || String(dataId).trim() === "") {
        throw new Error("ID data defect tidak ditemukan.");
      }

      const response = await api.put(
        `/defects/${encodeURIComponent(dataId)}/target`,
        {
          target,
          keterangan,
          status,
          lingkup,
          sublingkup,
          sta,
          bangunan,
          temuan,
          rekomendasi,
          lajur,
        },
      );

      if (response.data?.success === false) {
        throw new Error(response.data.message || "Gagal menyimpan data.");
      }

      await Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: response.data?.message || "Data berhasil disimpan.",
        confirmButtonText: "OK",
      });

      onSaved({
        ...defect,
        status,
        lingkup,
        sublingkup,
        target,
        keterangan,
        sta,
        bangunan,
        temuan,
        rekomendasi,
        lajur,
      });

      onClose();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        error ||
        "Gagal menyimpan data.";

      await Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: message,
        confirmButtonText: "Tutup",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal size="lg" labelledBy="targetModalTitle">
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <ModalHeader
          id="targetModalTitle"
          icon="fa-solid fa-pen-to-square"
          title="Edit Data"
          subtitle={`ID ${defect.data_id}`}
          onClose={onClose}
          closeDisabled={saving}
        />

        <ModalBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <FormField id="ruas" label="Ruas">
              <input
                id="ruas"
                type="text"
                className={input}
                value={ruas}
                disabled
              />
            </FormField>
            <FormField id="kegiatan" label="Kegiatan">
              <input
                id="kegiatan"
                type="text"
                className={input}
                value={kegiatan}
                disabled
              />
            </FormField>

            <FormField id="lokasi" label="Lokasi">
              <input
                id="lokasi"
                type="text"
                className={input}
                value={sta}
                onChange={(e) => setSta(e.target.value)}
              />
            </FormField>
            <FormField id="target" label="Target">
              <input
                id="target"
                type="date"
                className={input}
                value={target ? String(target).slice(0, 10) : ""}
                onChange={(e) => setTarget(e.target.value)}
              />
            </FormField>

            <FormField id="status" label="Status">
              <select
                name="status"
                id="status"
                className={input}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Pilih status</option>
                <option value="Open">Open</option>
                <option value="On Process">On Process</option>
                <option value="Close">Close</option>
              </select>
            </FormField>
            <FormField id="bangunan" label="Bangunan">
              <input
                id="bangunan"
                type="text"
                className={input}
                value={bangunan}
                onChange={(e) => setBangunan(e.target.value)}
              />
            </FormField>

            <FormField id="lingkup" label="Lingkup" span="sm:col-span-2">
              <select
                name="lingkup"
                id="lingkup"
                className={input}
                value={lingkup}
                onChange={(e) => setLingkup(e.target.value)}
              >
                <option value="">Pilih lingkup</option>
                <option value="Highway">Highway</option>
                <option value="Struktur">Struktur</option>
                <option value="Sarkapja">Sarkapja</option>
              </select>
            </FormField>
            <FormField id="sublingkup" label="Jalur" span="sm:col-span-2">
              <select
                name="sublingkup"
                id="sublingkup"
                className={input}
                value={sublingkup}
                onChange={(e) => setSublingkup(e.target.value)}
              >
                <option value="">Pilih jalur</option>
                <option value="Jalur A">Jalur A</option>
                <option value="Jalur B">Jalur B</option>
              </select>
            </FormField>
            <FormField id="lajur" label="Lajur" span="sm:col-span-2">
              <select
                name="lajur"
                id="lajur"
                className={input}
                value={lajur}
                onChange={(e) => setLajur(e.target.value)}
              >
                <option value="">Pilih lajur</option>
                <option value="L1">L1</option>
                <option value="L2">L2</option>
                <option value="Bahu Dalam">Bahu Dalam</option>
                <option value="Bahu Luar">Bahu Luar</option>
              </select>
            </FormField>

            <FormField id="temuan" label="Temuan" span="sm:col-span-6">
              <input
                id="temuan"
                type="text"
                className={input}
                value={temuan}
                onChange={(e) => setTemuan(e.target.value)}
              />
            </FormField>
            <FormField
              id="rekomendasi"
              label="Rekomendasi"
              span="sm:col-span-6"
            >
              <input
                id="rekomendasi"
                type="text"
                className={input}
                value={rekomendasi}
                onChange={(e) => setRekomendasi(e.target.value)}
              />
            </FormField>
            <FormField id="keterangan" label="Keterangan" span="sm:col-span-6">
              <textarea
                id="keterangan"
                className={textareaClass}
                rows={3}
                placeholder="Masukkan keterangan..."
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
              />
            </FormField>
          </div>
        </ModalBody>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {/* Hapus di kiri, jauh dari Simpan. Konfirmasi ditangani induk. */}
          {onDelete ? (
            <button
              type="button"
              className={deleteButtonClass}
              onClick={() => onDelete(defect)}
              disabled={saving}
            >
              <i className="fa-solid fa-trash-can" aria-hidden="true" />
              Hapus
            </button>
          ) : (
            <span />
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              className={btnOutline}
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </button>
            <button type="submit" className={btnPrimary} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
