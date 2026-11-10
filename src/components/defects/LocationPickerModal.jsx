import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
} from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { saveDefectLocation } from "../../services/dashboardServices";
import Swal from "sweetalert2";
import { btnOutline, btnPrimary } from "../ui/styles";
import { canManageDefect } from "../../utils/permission";
import { getStoredUser } from "../../services/authServices";

setWorkerUrl(workerUrl);

// z-index default SweetAlert2 = 1060, lebih rendah dari overlay picker (2000),
// jadi alert tersembunyi di belakang overlay dan tidak bisa diklik.
const SWAL_Z_INDEX = 3000;

function fireAlert(options) {
  return Swal.fire({
    ...options,
    didOpen: (popup) => {
      Swal.getContainer().style.zIndex = SWAL_Z_INDEX;
      options.didOpen?.(popup);
    },
  });
}

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const DEFAULT_CENTER = [106.8456, -6.2088];

function hasValidCoordinates(latitude, longitude) {
  if (
    latitude === null ||
    latitude === undefined ||
    longitude === null ||
    longitude === undefined ||
    String(latitude).trim() === "" ||
    String(longitude).trim() === ""
  ) {
    return false;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export default function LocationPickerModal({ defect, onClose, onSaved }) {
  const canManage = canManageDefect(getStoredUser()?.role);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const savingRef = useRef(false);

  const [saving, setSaving] = useState(false);
  const [coordinates, setCoordinates] = useState(null);

  useEffect(() => {
    if (!defect || !mapContainerRef.current) return;

    const hasCoordinates = hasValidCoordinates(
      defect.latitude,
      defect.longitude,
    );

    const initialCenter = hasCoordinates
      ? [Number(defect.longitude), Number(defect.latitude)]
      : DEFAULT_CENTER;

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: initialCenter,
      zoom: hasCoordinates ? 16 : 5,
      attributionControl: true,
    });

    mapRef.current = map;

    map.addControl(new NavigationControl(), "top-right");

    const updateCoordinates = () => {
      const center = map.getCenter();

      setCoordinates({
        latitude: center.lat,
        longitude: center.lng,
      });
    };

    const handleLoad = () => {
      map.resize();
      updateCoordinates();
    };

    map.on("load", handleLoad);
    map.on("moveend", updateCoordinates);

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.off("load", handleLoad);
      map.off("moveend", updateCoordinates);
      map.remove();
      mapRef.current = null;
      setCoordinates(null);
    };
  }, [defect]);

  const handleClose = () => {
    if (savingRef.current) return;
    onClose?.();
  };

  const handleSave = async () => {
    if (!canManage || savingRef.current) return;

    if (!defect?.data_id) {
      await fireAlert({
        icon: "error",
        title: "Gagal!",
        text: "Data ID defect tidak ditemukan.",
      });
      return;
    }

    if (!coordinates) {
      await fireAlert({
        icon: "warning",
        title: "Peta Belum Siap",
        text: "Tunggu sampai peta selesai dimuat.",
      });
      return;
    }

    savingRef.current = true;
    setSaving(true);

    fireAlert({
      title: "Menyimpan Lokasi...",
      text: "Mohon tunggu.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    let updated = null;
    let failure = null;

    try {
      updated = await saveDefectLocation(defect.data_id, coordinates);
    } catch (err) {
      console.error("Gagal menyimpan lokasi defect:", err);
      console.error("Error code:", err.code);
      console.error("HTTP status:", err.response?.status);
      console.error("Response data:", err.response?.data);
      failure = err;
    } finally {
      // Dilepas SEBELUM alert tampil, agar tombol tidak terkunci
      // saat alert menunggu diklik.
      Swal.close();
      savingRef.current = false;
      setSaving(false);
    }

    if (failure) {
      const isTimeout =
        failure.code === "ECONNABORTED" || failure.code === "ETIMEDOUT";

      await fireAlert({
        icon: "error",
        title: isTimeout ? "Waktu Habis!" : "Gagal Menyimpan!",
        text: isTimeout
          ? "Server tidak merespons dalam 10 detik. Periksa backend dan koneksi database."
          : failure.response?.data?.message ||
            failure.message ||
            "Gagal menyimpan lokasi defect.",
        confirmButtonText: "Tutup",
      });
      return;
    }

    await fireAlert({
      icon: "success",
      title: "Berhasil!",
      text: "Lokasi defect berhasil disimpan.",
      confirmButtonText: "OK",
    });

    onSaved?.(updated);
    onClose?.();
  };

  if (!defect || !canManage) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-2000 flex items-center justify-center bg-black/65 p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="locationPickerTitle"
    >
      <div className="flex h-[min(760px,96dvh)] w-[min(1000px,100%)] flex-col overflow-hidden rounded-2xl bg-white shadow-theme-lg">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 p-4">
          <div className="min-w-0">
            <h2
              className="text-lg font-semibold text-gray-800"
              id="locationPickerTitle"
            >
              Tentukan Lokasi Defect
            </h2>

            <p className="text-sm text-gray-500">
              Geser peta sampai pin berada tepat di lokasi defect.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Tutup"
            onClick={handleClose}
            disabled={saving}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {/* Peta */}
        <div className="relative min-h-0 flex-1">
          <div
            ref={mapContainerRef}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            }}
          />

          {/* Pin tetap di tengah peta */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 z-[2] -translate-x-1/2 -translate-y-full text-[38px] leading-none text-error-500 drop-shadow-md"
          >
            <i className="fa-solid fa-location-dot" />
          </div>

          {/* Koordinat saat ini */}
          <div className="absolute bottom-3 left-3 z-[3] rounded-lg bg-white px-3 py-2 text-xs shadow-theme-sm sm:text-sm">
            {coordinates
              ? `Lat: ${coordinates.latitude.toFixed(6)} · Long: ${coordinates.longitude.toFixed(6)}`
              : "Memuat koordinat peta..."}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={btnOutline}
            onClick={handleClose}
            disabled={saving}
          >
            Batal
          </button>

          <button
            type="button"
            className={btnPrimary}
            onClick={handleSave}
            disabled={saving || !coordinates}
          >
            {saving ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Menyimpan...
              </>
            ) : (
              <>
                <i className="fa-solid fa-location-dot" aria-hidden="true" />
                Simpan Lokasi
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
