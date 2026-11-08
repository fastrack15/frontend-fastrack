import { formatDate } from "../../utils/formatDate";
import { getPhotoUrl } from "../../utils/getPhotoUrl";
import Modal, { ModalBody, ModalHeader } from "../ui/Modal";
import PhotoFrame from "../layout/PhotoFrame";

function DefectPhotosModal({ defect, onClose }) {
  if (!defect) return null;

  return (
    <Modal
      size="xl"
      labelledBy="defectPhotosTitle"
      onBackdropClick={onClose}
      onEscape={onClose}
    >
      <ModalHeader
        id="defectPhotosTitle"
        title="Dokumentasi Defect"
        subtitle={`${defect.ruas || "Ruas tidak tersedia"} — ${
          defect.kegiatan || "Kegiatan tidak tersedia"
        }`}
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

        <div className="mt-4 space-y-1 text-sm text-gray-500">
          <p>
            <strong className="font-medium text-gray-700">Latitude:</strong>{" "}
            {defect.latitude ?? "-"}
          </p>
          <p>
            <strong className="font-medium text-gray-700">Longitude:</strong>{" "}
            {defect.longitude ?? "-"}
          </p>
        </div>
      </ModalBody>
    </Modal>
  );
}

export default DefectPhotosModal;
