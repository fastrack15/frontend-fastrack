import { useState } from "react";
import { formatDate, formatDateWithDay } from "../../utils/formatDate";
import { getPhotoUrl } from "../../utils/getPhotoUrl";
import PhotoFrame from "../../components/layout/PhotoFrame";
import DefectLocationMap from "./DefectLocationMap";
import LocationPickerModal from "./LocationPickerModal";
import { getRemainingDay } from "../../utils/getRemainingDay";
import Modal, { ModalBody, ModalHeader } from "../ui/Modal";
import { badgeError, btnPrimary } from "../ui/styles";

const TONES = {
  info: "bg-brand-25 border-brand-100 text-brand-500",
  warning: "bg-warning-50 border-warning-100 text-warning-600",
  success: "bg-success-50 border-success-100 text-success-600",
};

function InfoCard({ tone, icon, title, children }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 ${TONES[tone]}`}
    >
      <span className="mt-0.5 text-lg" aria-hidden="true">
        <i className={icon} />
      </span>
      <div className="min-w-0">
        <p className="text-base font-semibold text-gray-800">{title}</p>
        <p className="wrap-anywhere text-sm text-gray-600">{children}</p>
      </div>
    </div>
  );
}

function DefectDetailModal({ defect, onLocationSaved, onClose }) {
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  if (!defect) return null;

  const hasCoordinates =
    defect?.latitude !== null &&
    defect?.latitude !== undefined &&
    String(defect?.latitude).trim() !== "" &&
    defect?.longitude !== null &&
    defect?.longitude !== undefined &&
    String(defect?.longitude).trim() !== "" &&
    Number.isFinite(Number(defect?.latitude)) &&
    Number.isFinite(Number(defect?.longitude)) &&
    Number(defect.latitude) >= -90 &&
    Number(defect.latitude) <= 90 &&
    Number(defect.longitude) >= -180 &&
    Number(defect.longitude) <= 180;

  return (
    <>
      <Modal
        size="xl"
        labelledBy="detailDefectTitle"
        onBackdropClick={showLocationPicker ? undefined : onClose}
        onEscape={showLocationPicker ? undefined : onClose}
      >
        <ModalHeader
          id="detailDefectTitle"
          title="Detail Defect"
          aside={<span className={badgeError}>ID : {defect.data_id}</span>}
          onClose={onClose}
        />

        <ModalBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <PhotoFrame
              title="Foto Defect"
              name={defect.nama_defect}
              date={formatDate(defect.created_defect)}
              url={getPhotoUrl(defect.path_defect)}
            />

            <PhotoFrame
              title="Foto Progress"
              name={defect.nama_progress}
              date={formatDate(defect.created_progress)}
              url={getPhotoUrl(defect.path_progress)}
            />

            <PhotoFrame
              title="Foto Perbaikan"
              name={defect.nama_perbaikan}
              date={formatDate(defect.created_perbaikan)}
              url={getPhotoUrl(defect.path_perbaikan)}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              {!hasCoordinates && (
                <div className="flex h-full min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                  <button
                    type="button"
                    className={btnPrimary}
                    onClick={() => setShowLocationPicker(true)}
                  >
                    <i
                      className="fa-solid fa-location-dot"
                      aria-hidden="true"
                    />
                    Tambah Lokasi
                  </button>
                  <p className="mt-2 text-sm text-gray-500">
                    Koordinat lokasi defect belum tersedia.
                  </p>
                </div>
              )}

              {hasCoordinates && (
                <DefectLocationMap
                  latitude={defect.latitude}
                  longitude={defect.longitude}
                />
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-3">
              <InfoCard tone="info" icon="fa-solid fa-calendar" title="Target">
                {formatDateWithDay(defect.target)}
              </InfoCard>
              <InfoCard
                tone="warning"
                icon="fa-solid fa-clock"
                title="Sisa Hari"
              >
                {getRemainingDay(defect)}
              </InfoCard>
              <InfoCard
                tone="success"
                icon="fa-solid fa-bookmark"
                title="Keterangan"
              >
                {defect.keterangan ?? "-"}
              </InfoCard>
            </div>
          </div>
        </ModalBody>
      </Modal>

      <LocationPickerModal
        defect={showLocationPicker ? defect : null}
        onClose={() => setShowLocationPicker(false)}
        onSaved={(updated) => {
          onLocationSaved?.(updated);
          setShowLocationPicker(false);
        }}
      />
    </>
  );
}

export default DefectDetailModal;
