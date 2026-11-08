import { useEffect, useMemo, useState } from "react";
import api from "../../api";
import Swal from "sweetalert2";
import Modal, { ModalBody, ModalFooter, ModalHeader } from "../ui/Modal";
import {
  alertError,
  alertInfo,
  badgeWarning,
  btnOutline,
  btnSuccess,
  checkbox,
  input,
  textarea as textareaClass,
} from "../ui/styles";

// Nilai "-" hanya penanda tampilan dari toDefectRow, bukan data asli.
// Jangan sampai ikut tersimpan ke database.
const clean = (value) => (value == null || value === "-" ? "" : value);

const FIELDS = [
  { key: "target", label: "Target" },
  { key: "sta", label: "Lokasi" },
  { key: "status", label: "Status" },
  { key: "bangunan", label: "Bangunan" },
  { key: "lingkup", label: "Lingkup" },
  { key: "sublingkup", label: "Jalur" },
  { key: "lajur", label: "Lajur" },
  { key: "temuan", label: "Temuan" },
  { key: "rekomendasi", label: "Rekomendasi" },
  { key: "keterangan", label: "Keterangan" },
];

const EMPTY_VALUES = {
  target: "",
  sta: "",
  status: "",
  bangunan: "",
  lingkup: "",
  sublingkup: "",
  lajur: "",
  temuan: "",
  rekomendasi: "",
  keterangan: "",
};

const normalizeValue = (value, field) => {
  if (value == null || value === "") return "";

  if (field === "target") {
    return String(value).slice(0, 10);
  }

  return String(value).trim();
};

const getRowValue = (row, field) => {
  // Nama properti bangunan pada data API adalah jenis_bangunan.
  if (field === "bangunan") {
    return clean(row?.bangunan ?? row?.jenis_bangunan);
  }

  return clean(row?.[field]);
};

export default function BulkEditModal({ rows = [], onClose, onSaved }) {
  // Tidak ada kolom yang langsung aktif ketika modal dibuka.
  const [enabledFields, setEnabledFields] = useState([]);
  const [values, setValues] = useState({ ...EMPTY_VALUES });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [progress, setProgress] = useState("");

  const fieldVariations = useMemo(() => {
    const result = {};

    for (const field of FIELDS) {
      const uniqueValues = new Set(
        rows.map((row) =>
          normalizeValue(getRowValue(row, field.key), field.key),
        ),
      );

      result[field.key] = uniqueValues.size > 1;
    }

    return result;
  }, [rows]);

  // Kunci stabil dari kumpulan data yang dipilih. Polling useDefects membuat
  // array `rows` baru setiap 5 detik (isinya sama), jadi reset form tidak boleh
  // bergantung pada identitas array, hanya pada ID record yang dipilih.
  const selectedKey = useMemo(
    () => rows.map((row) => String(row.data_id)).join(","),
    [rows],
  );

  useEffect(() => {
    setEnabledFields([]);
    setValues({ ...EMPTY_VALUES });
    setError("");
    setProgress("");
  }, [selectedKey]);

  const toggleField = (field, checked) => {
    setEnabledFields((previous) =>
      checked
        ? previous.includes(field)
          ? previous
          : [...previous, field]
        : previous.filter((item) => item !== field),
    );

    setError("");
  };

  const changeValue = (field, value) => {
    setValues((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!rows.length) {
      setError("Tidak ada data yang dipilih.");
      return;
    }

    if (!enabledFields.length) {
      setError("Centang minimal satu kolom yang ingin diubah.");
      return;
    }

    if (
      rows.some(
        (row) => row.data_id == null || String(row.data_id).trim() === "",
      )
    ) {
      setError("Ada data yang tidak memiliki data_id.");
      return;
    }

    setSaving(true);

    let successCount = 0;
    const failures = [];

    try {
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];

        // Ambil nilai asli untuk mempertahankan kolom yang tidak diedit.
        const payload = {
          target: row.target ? String(row.target).slice(0, 10) : "",
          keterangan: row.keterangan ?? "",
          status: clean(row.status),
          lingkup: clean(row.lingkup),
          sublingkup: clean(row.sublingkup),
          sta: row.sta ?? "",
          bangunan: row.bangunan ?? row.jenis_bangunan ?? "",
          temuan: row.temuan ?? "",
          rekomendasi: row.rekomendasi ?? "",
          lajur: clean(row.lajur),
        };

        // Hanya field yang dicentang yang diubah.
        for (const field of enabledFields) {
          payload[field] = values[field];
        }

        try {
          const response = await api.put(
            `/defects/${encodeURIComponent(row.data_id)}/target`,
            payload,
          );

          if (response.data?.success === false) {
            throw new Error(response.data.message || "Gagal menyimpan data.");
          }

          successCount += 1;
        } catch (err) {
          failures.push({
            id: row.data_id,
            message:
              err.response?.data?.message ?? err.message ?? "Gagal menyimpan",
          });
        }

        setProgress(`Memproses ${index + 1} dari ${rows.length} data...`);
      }

      if (successCount > 0) {
        onSaved?.({
          rows,
          enabledFields,
          values,
          partial: failures.length > 0,
        });
      }

      if (failures.length > 0) {
        setError(
          `${successCount} data berhasil diperbarui, ` +
            `${failures.length} gagal. ` +
            failures
              .slice(0, 5)
              .map((item) => `ID ${item.id}: ${item.message}`)
              .join(" | "),
        );

        if (successCount === rows.length) {
          onClose();
        }

        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: `${successCount} data berhasil diperbarui.`,
        confirmButtonText: "OK",
      });

      onClose();
    } finally {
      setSaving(false);
      setProgress("");
    }
  };

  const renderInput = (field) => {
    const commonProps = {
      className: input,
      disabled: saving || !enabledFields.includes(field),
      value: values[field],
      onChange: (event) => changeValue(field, event.target.value),
    };

    switch (field) {
      case "target":
        return <input type="date" {...commonProps} />;

      case "sta":
        return (
          <input
            type="text"
            placeholder="Masukkan lokasi..."
            {...commonProps}
          />
        );

      case "status":
        return (
          <select
            className={input}
            disabled={saving || !enabledFields.includes(field)}
            value={values.status}
            onChange={(event) => changeValue("status", event.target.value)}
          >
            <option value="">Pilih status</option>
            <option value="Open">Open</option>
            <option value="On Process">On Process</option>
            <option value="Close">Close</option>
          </select>
        );

      case "bangunan":
        return (
          <input
            type="text"
            placeholder="Masukkan bangunan..."
            {...commonProps}
          />
        );

      case "lingkup":
        return (
          <select
            className={input}
            disabled={saving || !enabledFields.includes(field)}
            value={values.lingkup}
            onChange={(event) => changeValue("lingkup", event.target.value)}
          >
            <option value="">Pilih lingkup</option>
            <option value="Highway">Highway</option>
            <option value="Struktur">Struktur</option>
            <option value="Sarkapja">Sarkapja</option>
          </select>
        );

      case "sublingkup":
        return (
          <select
            className={input}
            disabled={saving || !enabledFields.includes(field)}
            value={values.sublingkup}
            onChange={(event) => changeValue("sublingkup", event.target.value)}
          >
            <option value="">Pilih jalur</option>
            <option value="Jalur A">Jalur A</option>
            <option value="Jalur B">Jalur B</option>
          </select>
        );

      case "lajur":
        return (
          <select
            className={input}
            disabled={saving || !enabledFields.includes(field)}
            value={values.lajur}
            onChange={(event) => changeValue("lajur", event.target.value)}
          >
            <option value="">Pilih lajur</option>
            <option value="L1">L1</option>
            <option value="L2">L2</option>
            <option value="Bahu Dalam">Bahu Dalam</option>
            <option value="Bahu Luar">Bahu Luar</option>
          </select>
        );

      case "temuan":
        return (
          <input
            type="text"
            placeholder="Masukkan temuan..."
            {...commonProps}
          />
        );

      case "rekomendasi":
        return (
          <input
            type="text"
            placeholder="Masukkan rekomendasi..."
            {...commonProps}
          />
        );

      case "keterangan":
        return (
          <textarea
            className={textareaClass}
            rows={3}
            placeholder="Masukkan keterangan..."
            disabled={saving || !enabledFields.includes(field)}
            value={values.keterangan}
            onChange={(event) => changeValue("keterangan", event.target.value)}
          />
        );

      default:
        return null;
    }
  };

  if (!rows.length) return null;

  return (
    <Modal size="lg" labelledBy="bulkEditTitle">
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <ModalHeader
          id="bulkEditTitle"
          icon="fa-solid fa-pen-to-square"
          title={`Edit Bulk (${rows.length} data)`}
          onClose={onClose}
          closeDisabled={saving}
        />

        <ModalBody>
          <div className={alertInfo}>
            Centang kolom yang ingin diubah. Badge{" "}
            <span className={badgeWarning}>VARIATIF</span> menandakan nilai
            kolom berbeda antar-record. Kolom yang tidak dicentang akan
            mempertahankan nilainya masing-masing.
          </div>

          <div className="mt-5 grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
            {FIELDS.map((field) => {
              const enabled = enabledFields.includes(field.key);
              const variable = fieldVariations[field.key];

              return (
                <div
                  className={`min-w-0 ${
                    field.key === "keterangan" || field.key === "rekomendasi"
                      ? "sm:col-span-2"
                      : ""
                  }`}
                  key={field.key}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <input
                      id={`bulk-enable-${field.key}`}
                      type="checkbox"
                      className={checkbox}
                      checked={enabled}
                      disabled={saving}
                      onChange={(event) =>
                        toggleField(field.key, event.target.checked)
                      }
                    />

                    <label
                      className="text-sm font-medium text-gray-700"
                      htmlFor={`bulk-enable-${field.key}`}
                    >
                      {field.label}
                    </label>

                    {variable && !enabled && (
                      <span className={badgeWarning}>VARIATIF</span>
                    )}
                  </div>

                  {renderInput(field.key)}
                </div>
              );
            })}
          </div>

          {progress && (
            <div className="mt-4 text-sm text-brand-600" role="status">
              {progress}
            </div>
          )}

          {error && (
            <div className={`${alertError} mt-4`} role="alert">
              {error}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            className={btnOutline}
            onClick={onClose}
            disabled={saving}
          >
            Batal
          </button>

          <button
            type="submit"
            className={btnSuccess}
            disabled={saving || rows.length === 0}
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
