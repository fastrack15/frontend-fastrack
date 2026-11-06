import {
  memo,
  useDeferredValue,
  useMemo,
  useState,
  useEffect,
  forwardRef,
  lazy,
  Suspense,
} from "react";
import useDefects, { useFilteredRows } from "../../hooks/useDefects";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatDate } from "../../utils/formatDate";
import EditDataModal from "./EditDataModal";
import BulkEditModal from "./BulkEditModal";
import Swal from "sweetalert2";
import { confirmDeleteDefect } from "../../utils/confirmDeleteDefect";
import Modal from "../ui/Modal";
import {
  alertError,
  badgeError,
  badgeSuccess,
  badgeWarning,
  btnDanger,
  btnOutline,
  btnPrimary,
  btnSuccess,
  btnWarning,
  card,
  checkbox,
  input,
} from "../ui/styles";

const RECORDS_PER_PAGE = 10;

// Kunci temuan sama dengan pengelompokan grafik "Jenis Defect": spasi dirapikan,
// huruf kecil, dan kosong atau "-" dianggap "tidak diketahui".
const temuanKey = (value) => {
  const raw = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  return raw === "" || raw === "-" ? "tidak diketahui" : raw.toLowerCase();
};

// Modal Detail membawa pustaka peta (maplibre-gl, ±1 MB) dan ExcelJS (±1 MB)
// hanya dipakai saat Export. Keduanya dimuat saat dibutuhkan, atau lebih awal
// ketika kursor/fokus mendekati tombolnya, supaya klik pertama terasa cepat.
const loadDetailModal = () => import("./DefectDetailModal");
const DefectDetailModal = lazy(loadDetailModal);
const loadExcelJS = () => import("exceljs");

const DateIconButton = forwardRef(function DateIconButton(
  { onClick, active, title },
  ref,
) {
  return (
    <button
      type="button"
      ref={ref}
      onClick={onClick}
      className={active ? btnPrimary : btnOutline}
      title={title}
      aria-label="Filter tanggal"
    >
      <i className="fa-solid fa-calendar-days" aria-hidden="true" />
      <span className="sm:hidden">Tanggal</span>
    </button>
  );
});

// width = persentase lebar tabel (total 100). Teks yang melebihi lebarnya
// dipotong "…" dan teks lengkap tampil saat di-hover (atribut title).
const CHECKBOX_COLUMN_WIDTH = "3%";
const COLUMNS = [
  { label: "No.", key: null, sortable: false, width: "3%" },
  { label: "Ruas", key: "ruas", width: "9%" },
  { label: "Kegiatan", key: "kegiatan", width: "9%" },
  { label: "Lokasi", key: "sta", width: "8%" },
  { label: "Jalur", key: "jalur", width: "6%" },
  { label: "Lajur", key: "lajur", width: "7%" },
  { label: "Lingkup", key: "lingkup", width: "7%" },
  { label: "Objek", key: "jenis_bangunan", width: "8%" },
  { label: "Temuan", key: "temuan", width: "9%" },
  { label: "Rekomendasi", key: "rekomendasi", width: "9%" },
  { label: "Tanggal", key: "created_at", width: "8%" },
  { label: "Status", key: "status", width: "8%" },
  { label: "Action", key: null, sortable: false, width: "6%" },
];

const locationSetting = (location) => {
  // Tangani lokasi kosong, null, undefined, atau bukan string.
  if (typeof location !== "string" || !location.trim()) {
    return "-";
  }

  const data = location.trim().split(/\s+/);

  const first = data[0].toUpperCase();
  let second = data[1];

  // Jika hanya ada satu bagian lokasi, tampilkan bagian pertama saja.
  if (!second) {
    return first;
  }

  if (second.includes("+")) {
    const parts = second.split("+");
    const prefix = parts[0];
    const suffix = parts[1];

    // Tambahkan angka 0 jika suffix terdiri dari 2 karakter.
    if (suffix && suffix.length === 1) {
      second = `${prefix}+${suffix}00`;
    } else if (suffix && suffix.length === 2) {
      second = `${prefix}+${suffix}0`;
    }
  } else {
    // Tambahkan +000 jika belum memiliki tanda +.
    second = `${second}+000`;
  }

  return `${first} ${second}`;
};

const capitaliseFirstLetter = (val) => {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
};

const statusBadgeClass = (status) =>
  status === "Close"
    ? badgeSuccess
    : status === "On Process"
      ? badgeWarning
      : badgeError;

// Daftar nomor halaman yang ringkas: 1 … 4 5 6 … 20
function getPageItems(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const items = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push("gap-start");
  for (let page = start; page <= end; page += 1) items.push(page);
  if (end < total - 1) items.push("gap-end");

  items.push(total);
  return items;
}

const iconButton =
  "inline-flex size-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/25";

function RowActions({ row, onSelect, onSelectTarget }) {
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        className={iconButton}
        type="button"
        title="Detail"
        aria-label={`Detail data ${row.data_id}`}
        onPointerEnter={loadDetailModal}
        onFocus={loadDetailModal}
        onClick={() => onSelect(row)}
      >
        <i className="fa-solid fa-eye" aria-hidden="true"></i>
      </button>
      <button
        className={iconButton}
        type="button"
        title="Edit"
        aria-label={`Edit data ${row.data_id}`}
        onClick={() => onSelectTarget(row)}
      >
        <i className="fa-solid fa-pen-to-square" aria-hidden="true"></i>
      </button>
    </div>
  );
}

// Baris tabel (layar >= lg).
const DefectRow = memo(function DefectRow({
  row,
  index,
  onSelect,
  selectedIds,
  onSelectTarget,
  onToggleSelect,
}) {
  return (
    <tr className="border-t border-gray-100 text-center transition-colors hover:bg-gray-50">
      <td className="px-1 py-3">
        <input
          type="checkbox"
          className={checkbox}
          aria-label={`Pilih data ${row.data_id}`}
          checked={selectedIds.includes(String(row.data_id))}
          onChange={() => onToggleSelect(row.data_id)}
        />
      </td>
      <td className="px-1 py-3">{index + 1}</td>
      <td className="truncate px-1 py-3" title={row.ruas}>
        {row.ruas}
      </td>
      <td className="truncate px-1 py-3" title={row.kegiatan}>
        {row.kegiatan}
      </td>
      <td className="truncate px-1 py-3" title={row.sta}>
        {locationSetting(row.sta)}
      </td>
      <td className="truncate px-1 py-3" title={row.jalur}>
        {row.jalur}
      </td>
      <td className="truncate px-1 py-3" title={row.lajur}>
        {row.lajur ?? "-"}
      </td>
      <td className="truncate px-1 py-3" title={row.lingkup}>
        {row.lingkup}
      </td>
      <td className="truncate px-1 py-3" title={row.jenis_bangunan}>
        {row.jenis_bangunan ? capitaliseFirstLetter(row.jenis_bangunan) : "-"}
      </td>
      <td className="truncate px-1 py-3" title={row.temuan}>
        {row.temuan ? capitaliseFirstLetter(row.temuan) : "-"}
      </td>
      <td className="truncate px-1 py-3" title={row.rekomendasi}>
        {row.rekomendasi ? capitaliseFirstLetter(row.rekomendasi) : "-"}
      </td>
      <td className="truncate px-1 py-3" title={formatDate(row.created_at)}>
        {formatDate(row.created_at)}
      </td>
      <td className="px-1 py-3">
        <span className={statusBadgeClass(row.status)}>{row.status}</span>
      </td>
      <td className="px-1 py-3">
        <RowActions
          row={row}
          onSelect={onSelect}
          onSelectTarget={onSelectTarget}
        />
      </td>
    </tr>
  );
});

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="wrap-anywhere text-sm text-gray-800">{children}</dd>
    </div>
  );
}

// Kartu data (layar < lg). Isinya sama dengan baris tabel.
const DefectCardItem = memo(function DefectCardItem({
  row,
  index,
  onSelect,
  selectedIds,
  onSelectTarget,
  onToggleSelect,
}) {
  return (
    <li className="rounded-xl border border-gray-200 p-3">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          className={checkbox}
          aria-label={`Pilih data ${row.data_id}`}
          checked={selectedIds.includes(String(row.data_id))}
          onChange={() => onToggleSelect(row.data_id)}
        />
        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
        <span className={`${statusBadgeClass(row.status)} ml-1`}>
          {row.status}
        </span>
        <div className="ml-auto">
          <RowActions
            row={row}
            onSelect={onSelect}
            onSelectTarget={onSelectTarget}
          />
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label="Ruas">{row.ruas || "-"}</Field>
        <Field label="Kegiatan">{row.kegiatan || "-"}</Field>
        <Field label="Lokasi">{locationSetting(row.sta)}</Field>
        <Field label="Tanggal">{formatDate(row.created_at)}</Field>
        <Field label="Jalur">{row.jalur}</Field>
        <Field label="Lajur">{row.lajur ?? "-"}</Field>
        <Field label="Lingkup">{row.lingkup}</Field>
        <Field label="Bangunan">
          {row.jenis_bangunan ? capitaliseFirstLetter(row.jenis_bangunan) : "-"}
        </Field>
        <div className="col-span-2">
          <Field label="Temuan">
            {row.temuan ? capitaliseFirstLetter(row.temuan) : "-"}
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="Rekomendasi">
            {row.rekomendasi ? capitaliseFirstLetter(row.rekomendasi) : "-"}
          </Field>
        </div>
      </dl>
    </li>
  );
});

function FilterSelect({ id, label, value, onChange, children }) {
  return (
    <select
      id={id}
      aria-label={label}
      title={label}
      className={`${input} min-w-0 @min-[1100px]:w-auto @min-[1100px]:max-w-40 @min-[1100px]:flex-1 @min-[1100px]:px-2.5 @min-[1100px]:text-[13px]`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
}

function DefectsCard({ onFilteredRowsChange, onRuasKegiatanChange }) {
  const { rows: fetchedRows, loading, error, updateRow } = useDefects();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [filterRuas, setFilterRuas] = useState("");
  const [filterKegiatan, setFilterKegiatan] = useState("");
  const [filterLingkup, setFilterLingkup] = useState("");
  const [filterJalur, setFilterJalur] = useState("");
  const [filterLajur, setFilterLajur] = useState("");
  const [filterTemuan, setFilterTemuan] = useState("");
  const [filterSchedule, setFilterSchedule] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  // Data yang sudah dihapus langsung disembunyikan tanpa menunggu polling
  // berikutnya, dan tidak muncul lagi bila ada polling yang sudah berjalan
  // sebelum penghapusan selesai.
  const [deletedIds, setDeletedIds] = useState([]);
  const rows = useMemo(
    () =>
      fetchedRows.filter((row) => !deletedIds.includes(String(row.data_id))),
    [fetchedRows, deletedIds],
  );

  // Pilihan data dikosongkan setiap kali filter berubah, supaya Edit Bulk
  // tidak mengenai data yang sudah tidak terlihat di tabel.
  const clearSelection = () =>
    setSelectedIds((previous) => (previous.length ? [] : previous));

  // Membungkus setter filter: ubah nilai filter, lalu kosongkan pilihan.
  const withClearSelection = (setter) => (value) => {
    setter(value);
    clearSelection();
  };

  const handleSort = (key) => {
    if (!key) return;

    if (sortKey === key) {
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }

    setCurrentPage(1);
  };

  // Input pencarian tetap responsif.
  const deferredSearch = useDeferredValue(search);

  // Pencarian menggunakan hook yang sudah ada.
  const searchedRows = useFilteredRows(rows, deferredSearch);

  // Buat pilihan filter berdasarkan data hasil pencarian.
  const filterOptions = useMemo(() => {
    const uniqueValues = (key) =>
      [
        ...new Set(
          searchedRows
            .map((row) => row[key])
            .filter((value) => value != null && String(value).trim() !== "")
            .map((value) => String(value).trim()),
        ),
      ].sort((a, b) => a.localeCompare(b, "id"));

    return {
      ruas: uniqueValues("ruas"),
      kegiatan: uniqueValues("kegiatan"),
      lingkup: uniqueValues("lingkup"),
      jalur: uniqueValues("jalur"),
      lajur: uniqueValues("lajur"),
      temuan: [
        ...new Set(searchedRows.map((row) => temuanKey(row.temuan))),
      ].sort((a, b) => a.localeCompare(b, "id")),
    };
  }, [searchedRows]);

  // Terapkan semua filter secara bersamaan.

  const filteredRows = useMemo(() => {
    // Konversi Date dari DatePicker menjadi YYYY-MM-DD
    const toDateKey = (date) => {
      if (!date) return "";

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    };

    const startDateKey = toDateKey(startDate);
    const endDateKey = toDateKey(endDate);
    const todayKey = toDateKey(new Date());

    return searchedRows.filter((row) => {
      const matchRuas =
        !filterRuas || String(row.ruas ?? "").trim() === filterRuas;

      const matchKegiatan =
        !filterKegiatan || String(row.kegiatan ?? "").trim() === filterKegiatan;

      const matchLingkup =
        !filterLingkup || String(row.lingkup ?? "").trim() === filterLingkup;

      const matchJalur =
        !filterJalur || String(row.jalur ?? "").trim() === filterJalur;

      const matchLajur =
        !filterLajur || String(row.lajur ?? "").trim() === filterLajur;

      const matchTemuan =
        !filterTemuan || temuanKey(row.temuan) === filterTemuan;

      // Mengambil tanggal langsung dari rows.created_at
      const rowDate = row.created_at ? String(row.created_at).slice(0, 10) : "";

      const matchTanggal =
        (!startDateKey || (rowDate !== "" && rowDate >= startDateKey)) &&
        (!endDateKey || (rowDate !== "" && rowDate <= endDateKey));

      // On Schedule / Behind Schedule: hanya data Open atau On Process
      // yang punya target. Data Close dan data tanpa target tidak ikut.
      const status = String(row.status ?? "")
        .trim()
        .toLowerCase();
      const targetKey = row.target ? String(row.target).slice(0, 10) : "";
      const isActive = status === "open" || status === "on process";

      const matchSchedule =
        !filterSchedule ||
        (isActive &&
          targetKey !== "" &&
          (filterSchedule === "onschedule"
            ? todayKey <= targetKey
            : todayKey > targetKey));

      return (
        matchRuas &&
        matchKegiatan &&
        matchLingkup &&
        matchJalur &&
        matchTanggal &&
        matchLajur &&
        matchTemuan &&
        matchSchedule
      );
    });
  }, [
    searchedRows,
    filterRuas,
    filterKegiatan,
    filterLingkup,
    filterJalur,
    filterLajur,
    filterTemuan,
    filterSchedule,
    startDate,
    endDate,
  ]);

  const ruasKegiatanRows = useMemo(() => {
    return rows.filter((row) => {
      const matchRuas =
        !filterRuas || String(row.ruas ?? "").trim() === filterRuas;

      const matchKegiatan =
        !filterKegiatan || String(row.kegiatan ?? "").trim() === filterKegiatan;

      return matchRuas && matchKegiatan;
    });
  }, [rows, filterRuas, filterKegiatan]);

  const handleExportExcel = async () => {
    if (exporting) return;

    if (!filteredRows.length) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    setExporting(true);

    try {
      // 1. Baca template Excel dari folder public/templates.
      const response = await fetch("/templates/Form%20Defect%20List.xlsx");

      if (!response.ok) {
        throw new Error(
          "Template Excel tidak ditemukan. Periksa folder public/templates.",
        );
      }

      const buffer = await response.arrayBuffer();

      // ExcelJS dimuat di sini (bukan di awal halaman).
      const excelModule = await loadExcelJS();
      const ExcelJS = excelModule.default ?? excelModule;
      const workbook = new ExcelJS.Workbook();

      await workbook.xlsx.load(buffer);

      const worksheet = workbook.getWorksheet("Defect List");

      if (!worksheet) {
        throw new Error('Sheet "Defect List" tidak ditemukan.');
      }

      // 2. Sesuaikan judul dengan filter aktif.
      const kegiatanTitle = filterKegiatan || "SEMUA KEGIATAN";
      const ruasTitle = filterRuas || "SEMUA RUAS";

      worksheet.getCell("A2").value =
        `DEFECT LIST ${kegiatanTitle} JALAN TOL ${ruasTitle}`;

      // 3. Bersihkan data lama pada baris isi.
      // Header template berada di baris 4; data dimulai dari baris 5.
      for (let rowNumber = 5; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.value = null;
        });
      }

      // 4. Salin style baris contoh template ke baris data.
      const copyRowStyle = (sourceRow, targetRow) => {
        sourceRow.eachCell({ includeEmpty: true }, (sourceCell, colNumber) => {
          const targetCell = targetRow.getCell(colNumber);

          targetCell.style = structuredClone(sourceCell.style);
          targetCell.numFmt = sourceCell.numFmt;
          targetCell.alignment = structuredClone(sourceCell.alignment);
          targetCell.border = structuredClone(sourceCell.border);
          targetCell.fill = structuredClone(sourceCell.fill);
          targetCell.font = structuredClone(sourceCell.font);
        });

        targetRow.height = sourceRow.height || 128;
      };

      const templateRow = worksheet.getRow(5);

      // 5. Fungsi untuk mengambil gambar dari backend.
      const getPhotoBase64 = async (path) => {
        if (!path || typeof path !== "string") return null;

        let normalizedPath = path.trim();

        if (!normalizedPath) return null;

        // Mendukung path relatif maupun URL penuh.
        if (/^https?:\/\//i.test(normalizedPath)) {
          const parsedUrl = new URL(normalizedPath);
          normalizedPath = parsedUrl.pathname;
        }

        normalizedPath = normalizedPath.replace(/^\/+/, "");
        normalizedPath = normalizedPath.replace(/^uploads\//, "");

        const photoUrl =
          `${import.meta.env.VITE_API_URL}/uploads/` +
          normalizedPath.split("/").map(encodeURIComponent).join("/");

        const photoResponse = await fetch(photoUrl);

        if (!photoResponse.ok) {
          console.warn("Foto gagal diambil:", photoUrl, photoResponse.status);
          return null;
        }

        const blob = await photoResponse.blob();
        const bitmap = await createImageBitmap(blob);

        // Konversi ke PNG agar format gambar lebih konsisten di ExcelJS.
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;

        const context = canvas.getContext("2d");

        if (!context) {
          bitmap.close();
          return null;
        }

        context.drawImage(bitmap, 0, 0);
        bitmap.close();

        const dataUrl = canvas.toDataURL("image/png");

        return {
          base64: dataUrl,
          width: canvas.width,
          height: canvas.height,
        };
      };

      // 6. Masukkan data yang telah difilter ke template.
      for (let index = 0; index < filteredRows.length; index++) {
        const item = filteredRows[index];
        const rowNumber = index + 5;
        const excelRow = worksheet.getRow(rowNumber);

        if (rowNumber > 5) {
          copyRowStyle(templateRow, excelRow);
        }

        // Urutan kolom mengikuti template Form Defect List.
        excelRow.getCell(1).value = index + 1;
        excelRow.getCell(2).value = item.data_id || "";
        excelRow.getCell(3).value = item.lingkup || "";
        excelRow.getCell(4).value = item.jalur || "";
        excelRow.getCell(5).value = item.lajur || "";
        excelRow.getCell(6).value = item.sta ? locationSetting(item.sta) : "";
        excelRow.getCell(7).value = item.jenis_bangunan || "";
        excelRow.getCell(8).value = item.temuan || "";
        excelRow.getCell(9).value = item.rekomendasi || "";
        excelRow.getCell(10).value = item.target
          ? String(item.target).slice(0, 10)
          : "";

        // Kolom K, L, M disediakan untuk gambar.
        excelRow.getCell(11).value = "";
        excelRow.getCell(12).value = "";
        excelRow.getCell(13).value = "";

        excelRow.getCell(14).value = item.status;
        excelRow.getCell(15).value = item.keterangan || "";

        excelRow.height = 128;

        // 7. Sematkan gambar ke kolom K, L, M.
        const photoColumns = [
          { path: item.path_defect, column: 10 },
          { path: item.path_progress, column: 11 },
          { path: item.path_perbaikan, column: 12 },
        ];

        for (const photo of photoColumns) {
          try {
            const image = await getPhotoBase64(photo.path);

            if (!image) continue;

            const imageId = workbook.addImage({
              base64: image.base64,
              extension: "png",
            });

            // Indeks baris dan kolom ExcelJS dimulai dari nol.
            worksheet.addImage(imageId, {
              tl: {
                col: photo.column,
                row: rowNumber - 1,
              },
              br: {
                col: photo.column + 1,
                row: rowNumber,
              },
              editAs: "oneCell",
            });
          } catch (photoError) {
            console.warn(
              `Gagal menyematkan foto pada baris ${rowNumber}:`,
              photoError,
            );
          }
        }

        excelRow.commit();
      }

      // 8. Buat dan unduh file Excel.
      const output = await workbook.xlsx.writeBuffer();

      const blob = new Blob([output], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = `Defect-List-${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Export Excel gagal:", error);
      alert(`Export Excel gagal: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    onFilteredRowsChange?.(error ? [] : filteredRows);
  }, [loading, error, filteredRows, onFilteredRowsChange]);

  useEffect(() => {
    if (loading) return;

    onRuasKegiatanChange?.(error ? [] : ruasKegiatanRows);
  }, [loading, error, ruasKegiatanRows, onRuasKegiatanChange]);

  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows;

    // Nilai yang diurutkan = nilai yang tampil di tabel. "-" hanya penanda
    // tampilan untuk data kosong, jadi diperlakukan sebagai kosong.
    const getValue = (row) =>
      sortKey === "sta" ? locationSetting(row.sta) : row[sortKey];
    const isEmpty = (value) => value == null || value === "" || value === "-";

    return [...filteredRows].sort((a, b) => {
      const valueA = getValue(a);
      const valueB = getValue(b);

      // Data kosong ditempatkan di bagian akhir.
      if (isEmpty(valueA)) {
        return isEmpty(valueB) ? 0 : 1;
      }

      if (isEmpty(valueB)) {
        return -1;
      }

      let comparison;

      if (sortKey === "created_at") {
        comparison = new Date(valueA).getTime() - new Date(valueB).getTime();
      } else {
        comparison = String(valueA).localeCompare(String(valueB), "id", {
          numeric: true,
          sensitivity: "base",
        });
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredRows, sortKey, sortDirection]);

  // Hitung pagination.
  const totalRecords = sortedRows.length;
  const totalPages = Math.ceil(totalRecords / RECORDS_PER_PAGE);

  // Jika hasil filter berubah, mulai kembali dari halaman pertama.
  useEffect(() => {
    setCurrentPage(1);
  }, [
    deferredSearch,
    filterRuas,
    filterKegiatan,
    filterLingkup,
    filterJalur,
    filterLajur,
    filterTemuan,
    filterSchedule,
    startDate,
    endDate,
  ]);

  // Menjaga halaman tetap valid ketika jumlah data berubah.
  useEffect(() => {
    if (currentPage > Math.max(totalPages, 1)) {
      setCurrentPage(Math.max(totalPages, 1));
    }
  }, [currentPage, totalPages]);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;

    return sortedRows.slice(startIndex, startIndex + RECORDS_PER_PAGE);
  }, [sortedRows, currentPage]);

  const resetFilters = () => {
    setSearch("");
    setFilterRuas("");
    setFilterKegiatan("");
    setFilterLingkup("");
    setFilterJalur("");
    setFilterLajur("");
    setFilterTemuan("");
    setFilterSchedule("");
    setCurrentPage(1);
    setDateRange([null, null]);
    clearSelection();
  };

  const startRecord =
    totalRecords === 0 ? 0 : (currentPage - 1) * RECORDS_PER_PAGE + 1;

  const endRecord = Math.min(currentPage * RECORDS_PER_PAGE, totalRecords);

  const toggleSelect = (dataId) => {
    const id = String(dataId);

    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  };

  // Hanya data terpilih yang masih lolos filter. Jika polling membuat data
  // terpilih tidak lagi cocok dengan filter, data itu tidak ikut diubah.
  const selectedRows = useMemo(
    () =>
      filteredRows.filter((row) => selectedIds.includes(String(row.data_id))),
    [filteredRows, selectedIds],
  );

  const allPageSelected =
    paginatedRows.length > 0 &&
    paginatedRows.every((row) => selectedIds.includes(String(row.data_id)));

  const handleSelectAllPage = (checked) => {
    const pageIds = paginatedRows.map((row) => String(row.data_id));

    setSelectedIds((previous) =>
      checked
        ? [...new Set([...previous, ...pageIds])]
        : previous.filter((id) => !pageIds.includes(id)),
    );
  };

  // Penghapusan diminta dari modal Edit, lalu dikonfirmasi lewat SweetAlert.
  const handleDelete = async (defect) => {
    const deleted = await confirmDeleteDefect(defect);

    if (deleted) handleDeleted(defect);
  };

  const handleDeleted = (defect) => {
    const id = String(defect.data_id);

    setDeletedIds((previous) =>
      previous.includes(id) ? previous : [...previous, id],
    );
    setSelectedIds((previous) => previous.filter((item) => item !== id));
    setSelectedTarget(null); // tutup juga modal Edit di bawahnya

    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Data berhasil dihapus.",
      confirmButtonText: "OK",
    });
  };

  const rowProps = {
    onSelect: setSelected,
    onSelectTarget: setSelectedTarget,
    selectedIds,
    onToggleSelect: toggleSelect,
  };

  const pageButton =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/25 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <section className={card}>
      {/* Filter */}
      <div className="@container border-b border-gray-200 p-4 md:p-5">
        {/* Kartu cukup lebar (>= 1420px): satu baris (pencarian, dropdown, tombol).
            Lebih sempit: pencarian + tombol di atas, dropdown di bawahnya.
            Memakai container query, jadi ikut berubah saat sidebar diciutkan. */}
        <div className="flex flex-wrap items-center gap-3 @min-[1100px]:flex-nowrap @min-[1100px]:gap-2">
          {/* Pencarian */}
          <div className="relative order-1 min-w-50 flex-1 @min-[1100px]:w-48 @min-[1100px]:min-w-37.5 @min-[1100px]:flex-none">
            <i
              className="fa-solid fa-magnifying-glass pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-gray-400"
              aria-hidden="true"
            />
            <input
              id="searchDefect"
              type="search"
              className={`${input} pl-10`}
              placeholder="Cari data defect..."
              aria-label="Cari data defect"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                clearSelection();
              }}
            />
          </div>

          {/* Filter dropdown */}
          <div className="order-3 grid w-full grid-cols-2 gap-3 @xl:grid-cols-3 @4xl:grid-cols-4 @6xl:grid-cols-7 @min-[1100px]:order-2 @min-[1100px]:flex @min-[1100px]:w-auto @min-[1100px]:min-w-0 @min-[1100px]:flex-1 @min-[1100px]:gap-2">
            <FilterSelect
              id="filterRuas"
              label="Filter ruas"
              value={filterRuas}
              onChange={withClearSelection(setFilterRuas)}
            >
              <option value="">Ruas</option>
              {filterOptions.ruas.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              id="filterKegiatan"
              label="Filter kegiatan"
              value={filterKegiatan}
              onChange={withClearSelection(setFilterKegiatan)}
            >
              <option value="">Kegiatan</option>
              {filterOptions.kegiatan.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              id="filterLingkup"
              label="Filter lingkup"
              value={filterLingkup}
              onChange={withClearSelection(setFilterLingkup)}
            >
              <option value="">Lingkup</option>
              {filterOptions.lingkup.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              id="filterJalur"
              label="Filter jalur"
              value={filterJalur}
              onChange={withClearSelection(setFilterJalur)}
            >
              <option value="">Jalur</option>
              {filterOptions.jalur.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              id="filterLajur"
              label="Filter lajur"
              value={filterLajur}
              onChange={withClearSelection(setFilterLajur)}
            >
              <option value="">Lajur</option>
              {filterOptions.lajur.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              id="filterTemuan"
              label="Filter temuan"
              value={filterTemuan}
              onChange={withClearSelection(setFilterTemuan)}
            >
              <option value="">Temuan</option>
              {filterOptions.temuan.map((item) => (
                <option key={item} value={item}>
                  {capitaliseFirstLetter(item)}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              id="filterSchedule"
              label="Filter schedule"
              value={filterSchedule}
              onChange={withClearSelection(setFilterSchedule)}
            >
              <option value="">Schedule</option>
              <option value="onschedule">On Schedule</option>
              <option value="behindschedule">Behind Schedule</option>
            </FilterSelect>
          </div>

          {/* Tombol */}
          <div className="order-2 flex flex-wrap items-center gap-2 @min-[1100px]:order-3 @min-[1100px]:shrink-0 @min-[1100px]:flex-nowrap">
            {/* Filter Tanggal */}
            <DatePicker
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => {
                setDateRange(update);
                setCurrentPage(1);
                clearSelection();
              }}
              dateFormat="dd-MM-yyyy"
              maxDate={new Date()}
              portalId="root"
              popperPlacement="bottom-end"
              customInput={
                <DateIconButton
                  active={Boolean(startDate)}
                  title={
                    startDate
                      ? `${startDate.toLocaleDateString("id-ID")}${
                          endDate
                            ? ` – ${endDate.toLocaleDateString("id-ID")}`
                            : ""
                        }`
                      : "Filter Tanggal"
                  }
                />
              }
            />

            <button type="button" className={btnDanger} onClick={resetFilters}>
              <i
                className="fa-solid fa-arrow-rotate-left"
                aria-hidden="true"
              ></i>
              Reset
            </button>

            <button
              type="button"
              className={btnSuccess}
              onClick={handleExportExcel}
              onPointerEnter={loadExcelJS}
              onFocus={loadExcelJS}
              disabled={exporting || loading || filteredRows.length === 0}
            >
              {exporting ? (
                <>
                  <span
                    className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    role="status"
                    aria-hidden="true"
                  />
                  Loading...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-file-excel" aria-hidden="true"></i>
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-5">
        {/* Status loading dan error */}
        {loading && <p className="text-sm text-gray-500">Memuat data...</p>}

        {error && (
          <div className={alertError} role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Bilah aksi: muncul hanya saat ada data terpilih, supaya baris
                filter tidak berubah ukuran. */}
            {selectedRows.length > 0 && (
              <div className="mb-4 flex flex-col gap-2 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-warning-700">
                  {selectedRows.length} data dipilih
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={btnWarning}
                    onClick={() => setShowBulkEdit(true)}
                  >
                    <i
                      className="fa-solid fa-pen-to-square"
                      aria-hidden="true"
                    ></i>
                    Edit Bulk
                  </button>

                  <button
                    type="button"
                    className={btnOutline}
                    onClick={() => setSelectedIds([])}
                  >
                    Batal pilih
                  </button>
                </div>
              </div>
            )}

            {/* Tabel (layar >= lg) */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px] table-fixed text-xs text-gray-700">
                <colgroup>
                  {/* Kolom checkbox Select All */}
                  <col style={{ width: CHECKBOX_COLUMN_WIDTH }} />

                  {/* Kolom data lainnya */}
                  {COLUMNS.map((col) => (
                    <col key={col.label} style={{ width: col.width }} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="bg-gray-50 text-gray-500">
                    <th className="rounded-l-lg px-1 py-3">
                      <input
                        type="checkbox"
                        className={checkbox}
                        aria-label="Pilih semua data pada halaman ini"
                        checked={allPageSelected}
                        onChange={(event) =>
                          handleSelectAllPage(event.target.checked)
                        }
                      />
                    </th>
                    {COLUMNS.map((col, columnIndex) => (
                      <th
                        key={col.label}
                        className={`px-1 py-3 text-xs font-medium ${
                          columnIndex === COLUMNS.length - 1
                            ? "rounded-r-lg"
                            : ""
                        }`}
                      >
                        <button
                          type="button"
                          disabled={col.sortable === false}
                          className="inline-flex items-center gap-1 rounded font-medium hover:text-gray-800 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/25 disabled:cursor-default disabled:hover:text-inherit"
                          onClick={() => handleSort(col.key)}
                          aria-label={`Urutkan berdasarkan ${col.label}`}
                        >
                          {col.label}

                          {col.key === null || col.key === undefined ? (
                            ""
                          ) : (
                            <i
                              className={`text-[10px] ${
                                sortKey !== col.key
                                  ? "fa-solid fa-up-down opacity-50"
                                  : sortDirection === "asc"
                                    ? "fa-solid fa-arrow-up-long text-brand-500"
                                    : "fa-solid fa-arrow-down-long text-brand-500"
                              }`}
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {paginatedRows.length > 0 ? (
                    paginatedRows.map((row, index) => (
                      <DefectRow
                        key={row.id ?? row.data_id ?? `${currentPage}-${index}`}
                        row={row}
                        index={(currentPage - 1) * RECORDS_PER_PAGE + index}
                        {...rowProps}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={COLUMNS.length + 1}
                        className="py-10 text-center text-sm text-gray-500"
                      >
                        Tidak ada data ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Daftar kartu (layar < lg) */}
            <div className="lg:hidden">
              {paginatedRows.length > 0 ? (
                <>
                  <label className="mb-3 flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      className={checkbox}
                      checked={allPageSelected}
                      onChange={(event) =>
                        handleSelectAllPage(event.target.checked)
                      }
                    />
                    Pilih semua data pada halaman ini
                  </label>

                  <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {paginatedRows.map((row, index) => (
                      <DefectCardItem
                        key={row.id ?? row.data_id ?? `${currentPage}-${index}`}
                        row={row}
                        index={(currentPage - 1) * RECORDS_PER_PAGE + index}
                        {...rowProps}
                      />
                    ))}
                  </ul>
                </>
              ) : (
                <p className="py-10 text-center text-sm text-gray-500">
                  Tidak ada data ditemukan.
                </p>
              )}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Menampilkan {startRecord}–{endRecord} dari {totalRecords} data
              </p>

              <nav aria-label="Navigasi halaman data defect">
                <ul className="flex flex-wrap items-center gap-1">
                  {/* Previous */}
                  <li>
                    <button
                      type="button"
                      className={`${pageButton} gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50`}
                      disabled={currentPage <= 1}
                      aria-label="Halaman sebelumnya"
                      onClick={() =>
                        setCurrentPage((page) => Math.max(1, page - 1))
                      }
                    >
                      <i
                        className="fa-solid fa-chevron-left text-xs"
                        aria-hidden="true"
                      />
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                  </li>

                  {/* Nomor halaman */}
                  {getPageItems(currentPage, totalPages).map((item) =>
                    typeof item === "number" ? (
                      <li key={item}>
                        <button
                          type="button"
                          className={`${pageButton} ${
                            currentPage === item
                              ? "bg-brand-500 text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          aria-current={
                            currentPage === item ? "page" : undefined
                          }
                          onClick={() => setCurrentPage(item)}
                        >
                          {item}
                        </button>
                      </li>
                    ) : (
                      <li
                        key={item}
                        className="px-1 text-gray-400"
                        aria-hidden="true"
                      >
                        …
                      </li>
                    ),
                  )}

                  {/* Next */}
                  <li>
                    <button
                      type="button"
                      className={`${pageButton} gap-1.5 border border-gray-300 text-gray-700 hover:bg-gray-50`}
                      disabled={totalPages === 0 || currentPage >= totalPages}
                      aria-label="Halaman berikutnya"
                      onClick={() =>
                        setCurrentPage((page) => Math.min(totalPages, page + 1))
                      }
                    >
                      <span className="hidden sm:inline">Next</span>
                      <i
                        className="fa-solid fa-chevron-right text-xs"
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </>
        )}
      </div>

      {showBulkEdit && (
        <BulkEditModal
          rows={selectedRows}
          onClose={() => setShowBulkEdit(false)}
          onSaved={() => {
            setSelectedIds([]);
            setShowBulkEdit(false);
          }}
        />
      )}

      {selected && (
        <Suspense
          fallback={
            <Modal
              labelledBy="detailLoadingTitle"
              onBackdropClick={() => setSelected(null)}
              onEscape={() => setSelected(null)}
            >
              <p
                id="detailLoadingTitle"
                className="p-8 text-center text-sm text-gray-500"
                role="status"
              >
                Memuat detail...
              </p>
            </Modal>
          }
        >
          <DefectDetailModal
            defect={selected}
            onClose={() => setSelected(null)}
            onLocationSaved={(updated) => {
              updateRow(updated.data_id, {
                latitude: updated.latitude,
                longitude: updated.longitude,
                location_pending: updated.location_pending,
              });
              setSelected((previous) =>
                previous ? { ...previous, ...updated } : previous,
              );
            }}
          />
        </Suspense>
      )}
      <EditDataModal
        defect={selectedTarget}
        onClose={() => setSelectedTarget(null)}
        onDelete={handleDelete}
        onSaved={(updated) => {
          updateRow(updated.data_id, {
            target: updated.target,
            keterangan: updated.keterangan,
          });
        }}
      />
    </section>
  );
}

export default DefectsCard;
