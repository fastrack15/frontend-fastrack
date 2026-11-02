import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Supercluster from "supercluster";
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  LngLatBounds,
  setWorkerUrl,
} from "maplibre-gl";

import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";

import { getDefects } from "../services/dashboardServices";
import DefectPhotosModal from "../components/defects/DefectPhotosModal";
import Modal, {
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "../components/ui/Modal";
import {
  alertError,
  btnOutline,
  btnIcon,
  input,
  label as labelClass,
} from "../components/ui/styles";
import { locationSetting } from "../utils/locationSetting";

setWorkerUrl(workerUrl);

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const DEFAULT_CENTER = [106.8456, -6.2088];

// Jarak peta ke tepi bawah layar (sama dengan padding halaman di layar >= md).
const MAP_BOTTOM_GAP = 24;

// Zoom maksimal saat klik kluster agar peta tidak masuk terlalu dalam.
const MAX_FOCUS_ZOOM = 18;

// Membuat gelembung angka untuk kluster. Ukurannya membesar mengikuti jumlah.
function createClusterElement(count) {
  const size = count < 10 ? 36 : count < 100 ? 44 : 54;
  const element = document.createElement("button");

  element.type = "button";
  element.textContent = count.toLocaleString("id-ID");
  element.title = `${count} data defect. Klik untuk memperbesar`;
  element.setAttribute(
    "aria-label",
    `${count} data defect, klik untuk memperbesar`,
  );

  Object.assign(element.style, {
    width: `${size}px`,
    height: `${size}px`,
    padding: "0",
    borderRadius: "50%",
    border: "3px solid rgba(255, 255, 255, 0.9)",
    background: "#dc3545",
    color: "#fff",
    fontSize: size > 40 ? "14px" : "13px",
    fontWeight: "700",
    lineHeight: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow:
      "0 0 0 4px rgba(220, 53, 69, 0.25), 0 2px 6px rgba(0, 0, 0, 0.3)",
  });

  return element;
}

// Nama lokasi diambil dari kolom sta; caption hanya cadangan untuk data lama.
function getLocationName(row) {
  const sta = String(row.sta ?? "").trim();

  if (sta && sta !== "-") {
    return sta;
  }

  const caption = String(row.caption ?? "");
  const firstLine = caption.split("\n")[0]?.trim();

  return firstLine || "-";
}

// Memvalidasi koordinat.
function getCoordinates(row) {
  const rawLatitude = row.latitude;
  const rawLongitude = row.longitude;

  if (
    rawLatitude == null ||
    rawLongitude == null ||
    String(rawLatitude).trim() === "" ||
    String(rawLongitude).trim() === ""
  ) {
    return null;
  }

  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

// Koordinat yang memiliki key sama akan digabung menjadi satu marker.
function getCoordinateKey({ latitude, longitude }) {
  return `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
}

function Defects() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map()); // key -> Marker (kluster atau titik)
  const clusterIndexRef = useRef(null); // indeks Supercluster
  const locationsRef = useRef(new Map()); // locKey -> { coordinates, defects }
  const wrapperRef = useRef(null);
  const lastFitKeyRef = useRef(null); // filter terakhir yang sudah di-zoom otomatis
  const [mapHeight, setMapHeight] = useState(null);

  // Hitung tinggi peta dari posisi aslinya di halaman, sehingga selalu
  // sampai ke bawah layar (tidak bergantung pada tinggi header, zoom browser, dll).
  useLayoutEffect(() => {
    const updateHeight = () => {
      const wrapper = wrapperRef.current;

      if (!wrapper) return;

      const top = wrapper.getBoundingClientRect().top + window.scrollY;

      setMapHeight(Math.max(420, window.innerHeight - top - MAP_BOTTOM_GAP));
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Template memberi <main> min-height: 100vh, yang membuat halaman ini
  // bisa di-scroll sedikit dan menyisakan ruang kosong di bawah peta.
  useEffect(() => {
    const main = document.getElementById("main-content");

    if (!main) return;

    const previous = main.style.minHeight;
    main.style.minHeight = "0";

    return () => {
      main.style.minHeight = previous;
    };
  }, []);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(
    () => typeof window === "undefined" || window.innerWidth >= 768,
  );

  const [selectedActivity, setSelectedActivity] = useState("");
  const [selectedRuas, setSelectedRuas] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  const [selectedDefect, setSelectedDefect] = useState(null);
  const [selectedDefectGroup, setSelectedDefectGroup] = useState([]);

  // Ambil data dari backend secara berkala tanpa reload halaman.
  useEffect(() => {
    let active = true;
    let timerId;
    let controller;
    let lastSignature = null;

    const fetchData = async () => {
      controller = new AbortController();

      try {
        const data = await getDefects(controller.signal);

        if (active) {
          const nextRows = Array.isArray(data) ? data : [];
          const signature = JSON.stringify(nextRows);

          // Polling tiap 5 detik selalu menghasilkan array baru. Jika isinya sama,
          // jangan update state agar peta tidak dibangun ulang dan tidak ter-zoom ulang.
          if (signature !== lastSignature) {
            lastSignature = signature;
            setRows(nextRows);
          }

          setError("");
        }
      } catch (err) {
        if (err.code !== "ERR_CANCELED" && active) {
          console.error("Gagal mengambil data defect:", err);
          setError("Gagal mengambil data defect dari server.");
        }
      } finally {
        if (active) {
          setLoading(false);
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

  // Inisialisasi peta.
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: 5,
      attributionControl: true,
    });

    mapRef.current = map;
    map.addControl(new NavigationControl(), "top-right");

    const handleLoad = () => {
      map.resize();
      setMapReady(true);
    };

    map.on("load", handleLoad);

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });

    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.off("load", handleLoad);

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = new Map();

      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Tambahkan nama lokasi ke setiap baris tanpa mengubah data asli.
  const normalizedRows = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        lokasi: getLocationName(row),
      })),
    [rows],
  );

  // Tahap 1: daftar kegiatan unik.
  const activities = useMemo(() => {
    return [
      ...new Set(
        normalizedRows
          .map((row) => String(row.kegiatan ?? "").trim())
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, "id"));
  }, [normalizedRows]);

  // Data yang cocok dengan kegiatan terpilih.
  const activityRows = useMemo(() => {
    if (!selectedActivity) return normalizedRows;

    return normalizedRows.filter(
      (row) => String(row.kegiatan ?? "").trim() === selectedActivity,
    );
  }, [normalizedRows, selectedActivity]);

  // Tahap 2: daftar ruas yang terkait dengan kegiatan.
  const ruasOptions = useMemo(() => {
    return [
      ...new Set(
        activityRows
          .map((row) => String(row.ruas ?? "").trim())
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, "id"));
  }, [activityRows]);

  // Data yang cocok dengan kegiatan dan ruas terpilih.
  const ruasRows = useMemo(() => {
    if (!selectedRuas) return activityRows;

    return activityRows.filter(
      (row) => String(row.ruas ?? "").trim() === selectedRuas,
    );
  }, [activityRows, selectedRuas]);

  // Tahap 3: daftar lokasi untuk kegiatan dan ruas terpilih.
  const locationOptions = useMemo(() => {
    if (!selectedActivity || !selectedRuas) return [];

    return [
      ...new Set(
        ruasRows
          .map((row) => row.sta)
          .filter((location) => location && location !== "-"),
      ),
    ].sort((a, b) => a.localeCompare(b, "id"));
  }, [ruasRows, selectedActivity, selectedRuas]);

  // Data yang akan ditampilkan pada peta.
  // Jika lokasi dipilih, peta hanya menampilkan titik lokasi tersebut.
  const displayedRows = useMemo(() => {
    if (!selectedLocation) return ruasRows;

    return ruasRows.filter((row) => row.sta === selectedLocation);
  }, [ruasRows, selectedLocation]);

  // Reset ruas dan lokasi ketika kegiatan berubah.
  const handleActivityChange = (value) => {
    setSelectedActivity(value);
    setSelectedRuas("");
    setSelectedLocation("");
  };

  // Reset lokasi ketika ruas berubah.
  const handleRuasChange = (value) => {
    setSelectedRuas(value);
    setSelectedLocation("");
  };

  // Hapus seluruh filter.
  const resetFilters = () => {
    setSelectedActivity("");
    setSelectedRuas("");
    setSelectedLocation("");
  };

  // Hitung jumlah data dan lokasi unik pada hasil filter.
  const validCoordinateCount = useMemo(
    () => displayedRows.filter((row) => getCoordinates(row)).length,
    [displayedRows],
  );

  const uniqueLocationCount = useMemo(
    () =>
      new Set(
        displayedRows
          .map((row) => {
            const coordinates = getCoordinates(row);
            return coordinates ? getCoordinateKey(coordinates) : null;
          })
          .filter(Boolean),
      ).size,
    [displayedRows],
  );

  // Gambar marker/kluster sesuai area dan zoom peta saat ini.
  // Marker dipakai ulang (cache) agar tidak berkedip saat peta digeser.
  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    const index = clusterIndexRef.current;

    if (!map || !index) return;

    const [[west, south], [east, north]] = map.getBounds().toArray();
    const items = index.getClusters(
      [west, south, east, north],
      Math.floor(map.getZoom()),
    );

    const cache = markersRef.current;
    const visibleKeys = new Set();

    items.forEach((item) => {
      const [longitude, latitude] = item.geometry.coordinates;
      const {
        cluster,
        cluster_id: clusterId,
        locKey,
        defectCount,
      } = item.properties;

      const key = cluster ? `c:${clusterId}:${defectCount}` : `p:${locKey}`;
      visibleKeys.add(key);

      if (cache.has(key)) return;

      let marker;

      if (cluster) {
        // Kluster: klik untuk zoom ke level tempat titik-titiknya terpisah.
        const element = createClusterElement(defectCount);

        element.addEventListener("click", () => {
          map.easeTo({
            center: [longitude, latitude],
            zoom: Math.min(
              index.getClusterExpansionZoom(clusterId),
              MAX_FOCUS_ZOOM,
            ),
            duration: 600,
          });
        });

        marker = new Marker({ element });
      } else {
        // Titik tunggal (satu koordinat, bisa memuat beberapa defect).
        const defects = locationsRef.current.get(locKey)?.defects ?? [];

        marker = new Marker({ anchor: "bottom", color: "#dc3545" });

        const element = marker.getElement();
        element.title =
          defects.length > 1
            ? `${defects.length} data defect`
            : "Lihat dokumentasi defect";
        element.setAttribute(
          "aria-label",
          `Lihat ${defects.length} data defect`,
        );

        element.addEventListener("click", () => {
          if (defects.length === 1) {
            setSelectedDefectGroup([]);
            setSelectedDefect(defects[0]);
          } else {
            setSelectedDefect(null);
            setSelectedDefectGroup(defects);
          }
        });
      }

      marker.setLngLat([longitude, latitude]).addTo(map);
      cache.set(key, marker);
    });

    // Hapus marker yang tidak lagi terlihat pada tampilan ini.
    cache.forEach((marker, key) => {
      if (!visibleKeys.has(key)) {
        marker.remove();
        cache.delete(key);
      }
    });
  }, []);

  // Bangun ulang indeks kluster setiap kali hasil filter berubah.
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) return;

    const groupedLocations = new Map();

    displayedRows.forEach((row) => {
      const coordinates = getCoordinates(row);

      if (!coordinates) return;

      const key = getCoordinateKey(coordinates);

      if (!groupedLocations.has(key)) {
        groupedLocations.set(key, {
          coordinates,
          defects: [],
        });
      }

      groupedLocations.get(key).defects.push(row);
    });

    locationsRef.current = groupedLocations;

    // Satu fitur per koordinat; defectCount dijumlahkan di tiap kluster.
    const index = new Supercluster({
      radius: 60, // jarak (px) antar titik agar digabung
      maxZoom: 16, // di atas zoom ini semua titik tampil terpisah
      minPoints: 2,
      map: (props) => ({ defectCount: props.defectCount }),
      reduce: (accumulated, props) => {
        accumulated.defectCount += props.defectCount;
      },
    });

    index.load(
      Array.from(groupedLocations.entries()).map(
        ([key, { coordinates, defects }]) => ({
          type: "Feature",
          properties: { locKey: key, defectCount: defects.length },
          geometry: {
            type: "Point",
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
        }),
      ),
    );

    clusterIndexRef.current = index;

    // Data berubah: buang marker lama, lalu gambar ulang.
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();
    renderMarkers();

    // Zoom otomatis mengikuti titik hasil filter. Hanya dilakukan saat pilihan filter
    // berubah (atau saat data pertama kali tersedia), bukan setiap data di-refresh,
    // supaya posisi dan zoom peta yang sedang dipakai user tidak berpindah sendiri.
    const locations = Array.from(groupedLocations.values());
    const fitKey = `${selectedActivity}|${selectedRuas}|${selectedLocation}`;

    if (locations.length === 0) {
      lastFitKeyRef.current = null;
      return;
    }

    if (lastFitKeyRef.current === fitKey) return;

    lastFitKeyRef.current = fitKey;

    if (locations.length === 1) {
      const { coordinates } = locations[0];

      map.flyTo({
        center: [coordinates.longitude, coordinates.latitude],
        zoom: 15,
        essential: true,
      });
    } else if (locations.length > 1) {
      const bounds = locations.reduce(
        (result, { coordinates }) =>
          result.extend([coordinates.longitude, coordinates.latitude]),
        new LngLatBounds(),
      );

      map.fitBounds(bounds, {
        padding: 70,
        maxZoom: 15,
        duration: 800,
      });
    }
  }, [
    displayedRows,
    mapReady,
    renderMarkers,
    selectedActivity,
    selectedRuas,
    selectedLocation,
  ]);

  // Perbarui kluster setiap kali peta selesai digeser atau di-zoom.
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !mapReady) return;

    map.on("moveend", renderMarkers);

    return () => {
      map.off("moveend", renderMarkers);
    };
  }, [mapReady, renderMarkers]);

  const closeDefectGroup = () => {
    setSelectedDefectGroup([]);
  };

  return (
    // Kontainer peta HARUS punya tinggi eksplisit: peta (position: absolute)
    // runtuh menjadi 0px jika induknya tidak punya tinggi.
    <div
      ref={wrapperRef}
      className="relative overflow-hidden rounded-2xl border border-gray-200"
      style={{
        height: mapHeight ?? "calc(100vh - 140px)", // cadangan sebelum diukur
        minHeight: 420,
      }}
    >
      <div
        ref={mapContainerRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* Panel informasi dan filter */}
      <div className="absolute top-3 left-3 z-[2] flex max-h-[calc(100%-1.5rem)] w-[calc(100%-4.75rem)] sm:w-[360px] flex-col rounded-xl bg-white shadow-theme-lg">
        <div className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 font-semibold text-gray-800">
              <i
                className="fa-solid fa-location-dot text-error-500"
                aria-hidden="true"
              />
              Peta Lokasi Defect
            </h1>

            <p className="text-sm text-gray-500">
              {loading
                ? "Memuat data..."
                : `${validCoordinateCount} data · ${uniqueLocationCount} titik unik`}
            </p>
          </div>

          <button
            type="button"
            className={btnIcon}
            aria-expanded={panelOpen}
            aria-controls="map-filter-panel"
            aria-label={panelOpen ? "Sembunyikan filter" : "Tampilkan filter"}
            onClick={() => setPanelOpen((open) => !open)}
          >
            <i
              className={`fa-solid ${panelOpen ? "fa-chevron-up" : "fa-sliders"}`}
              aria-hidden="true"
            />
          </button>
        </div>

        <div
          id="map-filter-panel"
          className={`min-h-0 flex-1 space-y-4 overflow-y-auto border-t border-gray-200 p-4 ${
            panelOpen ? "" : "hidden"
          }`}
        >
          {error && (
            <div className={alertError} role="alert">
              {error}
            </div>
          )}

          {/* Filter kegiatan */}
          <div>
            <label htmlFor="filterActivity" className={labelClass}>
              Kegiatan
            </label>

            <select
              id="filterActivity"
              className={input}
              value={selectedActivity}
              onChange={(event) => handleActivityChange(event.target.value)}
              disabled={loading || !!error}
            >
              <option value="">Semua kegiatan</option>

              {activities.map((activity) => (
                <option key={activity} value={activity}>
                  {activity}
                </option>
              ))}
            </select>
          </div>

          {/* Filter ruas: tampil setelah kegiatan dipilih */}
          {selectedActivity && (
            <div>
              <label htmlFor="filterRuas" className={labelClass}>
                Ruas
              </label>

              <select
                id="filterRuas"
                className={input}
                value={selectedRuas}
                onChange={(event) => handleRuasChange(event.target.value)}
                disabled={loading || !!error}
              >
                <option value="">Semua ruas</option>

                {ruasOptions.map((ruas) => (
                  <option key={ruas} value={ruas}>
                    {ruas}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Daftar lokasi muncul setelah kegiatan dan ruas dipilih */}
          {selectedActivity && selectedRuas && (
            <div>
              <p className={labelClass}>Lokasi ({locationOptions.length})</p>

              {locationOptions.length > 0 ? (
                <div className="max-h-56 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    onClick={() => setSelectedLocation("")}
                  >
                    <i
                      className="fa-solid fa-location-dot text-gray-400"
                      aria-hidden="true"
                    />
                    All Location
                  </button>
                  {locationOptions.map((location) => (
                    <button
                      key={location}
                      type="button"
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                        selectedLocation === location
                          ? "bg-brand-500 text-white"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() =>
                        setSelectedLocation((current) =>
                          current === location ? "" : location,
                        )
                      }
                      title="Klik untuk memusatkan peta ke lokasi ini"
                    >
                      <i
                        className={`fa-solid fa-location-dot ${
                          selectedLocation === location
                            ? "text-white"
                            : "text-gray-400"
                        }`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 wrap-anywhere">
                        {locationSetting(location)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Tidak ada nama lokasi pada data ini.
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            className={`${btnOutline} w-full`}
            onClick={resetFilters}
          >
            <i className="fa-solid fa-arrow-rotate-left" aria-hidden="true" />
            Reset Filter
          </button>

          {!loading && !error && validCoordinateCount === 0 && (
            <p className="text-sm text-gray-500">
              Tidak ada data dengan koordinat valid pada pilihan ini.
            </p>
          )}
        </div>
      </div>

      {/* Modal pilihan untuk beberapa defect pada koordinat sama */}
      {selectedDefectGroup.length > 0 && (
        <Modal
          labelledBy="defectGroupTitle"
          onBackdropClick={closeDefectGroup}
          onEscape={closeDefectGroup}
        >
          <ModalHeader
            id="defectGroupTitle"
            title="Pilih Data Defect"
            subtitle={`${selectedDefectGroup.length} data pada koordinat sama`}
            onClose={closeDefectGroup}
          />

          <ModalBody>
            <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
              {selectedDefectGroup.map((defect, index) => (
                <button
                  key={
                    defect.data_id ??
                    defect.id ??
                    `${index}-${defect.created_at ?? ""}`
                  }
                  type="button"
                  className="block w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
                  onClick={() => {
                    setSelectedDefectGroup([]);
                    setSelectedDefect(defect);
                  }}
                >
                  <div className="font-medium text-gray-800">
                    {defect.lokasi || "Lokasi tidak tersedia"}
                  </div>

                  <div className="text-sm text-gray-500">
                    {defect.ruas || "Ruas tidak tersedia"}
                    {" · "}
                    {defect.kegiatan || "Kegiatan tidak tersedia"}
                  </div>
                </button>
              ))}
            </div>
          </ModalBody>

          <ModalFooter>
            <button
              type="button"
              className={btnOutline}
              onClick={closeDefectGroup}
            >
              Tutup
            </button>
          </ModalFooter>
        </Modal>
      )}

      {/* Modal dokumentasi tanpa peta */}
      <DefectPhotosModal
        defect={selectedDefect}
        onClose={() => setSelectedDefect(null)}
      />
    </div>
  );
}

export default Defects;
