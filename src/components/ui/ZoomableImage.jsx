import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Tampilan foto layar penuh. Dirender lewat portal ke <body> agar tidak
// terpengaruh overflow/z-index modal di bawahnya.
function PhotoLightbox({ src, title, caption, onClose }) {
  const closeRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        // Fase capture + stopImmediatePropagation: modal di bawah foto (yang
        // juga menutup diri saat Esc) tidak ikut tertutup.
        event.stopImmediatePropagation();
        onClose();
      } else if (event.key === "Tab") {
        // Satu-satunya elemen yang bisa difokus adalah tombol tutup.
        event.preventDefault();
        closeRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[1100] flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label={`Foto: ${title}`}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        // Klik di area kosong (bukan foto atau tombol) menutup foto.
        if (!event.target.closest("img, button")) onClose();
      }}
    >
      <div className="flex items-start justify-between gap-3 px-4 py-3 text-white sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-base font-medium">{title}</p>
          {caption && (
            <p className="truncate text-sm text-white/70">{caption}</p>
          )}
        </div>

        <button
          ref={closeRef}
          type="button"
          aria-label="Tutup foto"
          onClick={onClose}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-3 focus-visible:ring-white/50 focus-visible:outline-none"
        >
          <i className="fa-solid fa-xmark text-lg" aria-hidden="true" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-3 pb-4 sm:px-6 sm:pb-6">
        {failed ? (
          <p className="text-sm text-white/70">Foto tidak dapat ditampilkan.</p>
        ) : (
          <img
            src={src}
            alt={title}
            className="max-h-[calc(100dvh-6rem)] max-w-full rounded-lg object-contain shadow-2xl select-none"
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}

// Foto kecil yang bisa diklik untuk diperbesar. Dipakai di PhotoFrame.
function ZoomableImage({ src, title, caption, onError }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus(); // fokus kembali ke foto kecil
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title="Klik untuk memperbesar"
        aria-label={`Perbesar ${title}`}
        onClick={() => setOpen(true)}
        className="group relative block h-full w-full cursor-zoom-in focus-visible:ring-3 focus-visible:ring-brand-500/40 focus-visible:outline-none focus-visible:ring-inset"
      >
        <img
          src={src}
          alt={title}
          loading="lazy"
          className="h-full w-full object-contain"
          onError={onError}
        />
      </button>

      {open && (
        <PhotoLightbox
          src={src}
          title={title}
          caption={caption}
          onClose={close}
        />
      )}
    </>
  );
}

export default ZoomableImage;
