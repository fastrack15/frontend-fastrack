import { useEffect } from "react";

const SIZES = {
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-5xl",
};

// Kerangka modal murni tampilan. Di layar kecil tampil sebagai lembar dari
// bawah (bottom sheet); di layar lebar tampil di tengah.
export default function Modal({
  children,
  size = "md",
  labelledBy,
  onBackdropClick,
  onEscape,
}) {
  // Kunci scroll halaman selama modal terbuka.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (!onEscape) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onEscape();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onEscape]);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-gray-900/50 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onBackdropClick?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-theme-lg sm:max-h-[90dvh] sm:rounded-2xl ${SIZES[size] ?? SIZES.md}`}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({ id, title, subtitle, icon, aside, onClose, closeDisabled }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
            <i className={icon} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h2 id={id} className="truncate text-lg font-semibold text-gray-800">
            {title}
          </h2>
          {subtitle && (
            <p className="truncate text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {aside}
        {onClose && (
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            disabled={closeDisabled}
            className="inline-flex size-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

export function ModalBody({ children }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
      {children}
    </div>
  );
}

export function ModalFooter({ children }) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
      {children}
    </div>
  );
}
