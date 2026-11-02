import { useEffect, useRef } from "react";
import {
  Map as MapLibreMap,
  Marker,
  Popup,
  NavigationControl,
  setWorkerUrl,
} from "maplibre-gl";

import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";

// Konfigurasi worker untuk Vite + MapLibre GL JS v6
setWorkerUrl(workerUrl);

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

function DefectLocationMap({ latitude, longitude }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const lat = Number(latitude);
  const lng = Number(longitude);

  const validCoordinates =
    latitude !== null &&
    latitude !== undefined &&
    String(latitude).trim() !== "" &&
    longitude !== null &&
    longitude !== undefined &&
    String(longitude).trim() !== "" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  useEffect(() => {
    if (!validCoordinates || !mapContainerRef.current) {
      return;
    }

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [lng, lat],
      zoom: 16,
      attributionControl: true,
    });

    mapRef.current = map;

    map.addControl(new NavigationControl(), "top-right");

    new Marker({ color: "#dc3545" })
      .setLngLat([lng, lat])
      .setPopup(
        new Popup({ offset: 25 }).setHTML(
          `<div>
            <strong>Lokasi Defect</strong>
            <br />
            ${lat}, ${lng}
          </div>`,
        ),
      )
      .addTo(map);

    // Peta perlu di-resize jika berada dalam Bootstrap modal.
    const modalElement = mapContainerRef.current.closest(".modal");

    const handleModalShown = () => {
      map.resize();
    };

    modalElement?.addEventListener("shown.bs.modal", handleModalShown);

    map.once("load", () => {
      map.resize();
    });

    return () => {
      modalElement?.removeEventListener("shown.bs.modal", handleModalShown);

      map.remove();
      mapRef.current = null;
    };
  }, [validCoordinates, lat, lng]);

  return (
    <div>
      {validCoordinates ? (
        <>
          <div
            ref={mapContainerRef}
            className="h-72 w-full rounded-xl sm:h-[350px]"
          />

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={`https://www.google.com/maps?q=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-brand-200 px-3 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-25 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/25"
            >
              <i className="fa-solid fa-location-dot" aria-hidden="true" />
              Buka di Google Maps
            </a>
            <p className="text-sm text-gray-500">
              Latitude: {lat} | Longitude: {lng}
            </p>
          </div>
        </>
      ) : (
        <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-400">
          <i className="fa-solid fa-location-dot text-3xl" aria-hidden="true" />
          <span className="text-sm">Koordinat lokasi belum tersedia</span>
        </div>
      )}
    </div>
  );
}

export default DefectLocationMap;
