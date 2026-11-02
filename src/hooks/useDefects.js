import { useCallback, useEffect, useMemo, useState } from "react";
import { getDefects } from "../services/dashboardServices";
import { toDefectRow } from "../utils/parseDefect";

export default function useDefects() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let timerId;
    let controller;

    const fetchData = async () => {
      controller = new AbortController();

      try {
        const data = await getDefects(controller.signal);

        if (active) {
          setRows((Array.isArray(data) ? data : []).map(toDefectRow));
          setError("");
        }
      } catch (err) {
        if (err.code !== "ERR_CANCELED" && active) {
          console.error("Gagal mengambil data defect:", err);
          setError("Gagal mengambil data defect.");
        }
      } finally {
        if (active) {
          setLoading(false);

          // Jadwalkan pengambilan data berikutnya setelah
          // permintaan sebelumnya selesai.
          timerId = setTimeout(fetchData, 5000);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
      clearTimeout(timerId);
      controller?.abort();
    };
  }, []);

  const updateRow = useCallback((dataId, patch) => {
    setRows((previous) =>
      previous.map((row) =>
        String(row.data_id) === String(dataId) ? { ...row, ...patch } : row,
      ),
    );
  }, []);

  return { rows, loading, error, updateRow };
}

export function useFilteredRows(rows, search) {
  return useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;
    return rows.filter((row) => row.searchText.includes(keyword));
  }, [rows, search]);
}
