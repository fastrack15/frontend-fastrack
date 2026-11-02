// Kelas Tailwind yang dipakai berulang. Hanya string, tanpa logika.

const focusRing =
  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-500/25";

const btnBase = `inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

export const btnPrimary = `${btnBase} bg-brand-500 text-white hover:bg-brand-600`;
export const btnOutline = `${btnBase} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`;
export const btnDanger = `${btnBase} bg-error-500 text-white hover:bg-error-600`;
export const btnSuccess = `${btnBase} bg-success-600 text-white hover:bg-success-700`;
export const btnWarning = `${btnBase} bg-warning-500 text-white hover:bg-warning-600`;
export const btnIcon = `inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 ${focusRing}`;

export const label = "mb-1.5 block text-sm font-medium text-gray-700";

export const input =
  "h-10 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

export const textarea =
  "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

export const card = "rounded-2xl border border-gray-200 bg-white shadow-theme-xs";

export const checkbox =
  "size-4 shrink-0 cursor-pointer rounded border-gray-300 accent-brand-500";

const badgeBase =
  "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium";
export const badgeSuccess = `${badgeBase} bg-success-50 text-success-700`;
export const badgeWarning = `${badgeBase} bg-warning-50 text-warning-700`;
export const badgeError = `${badgeBase} bg-error-50 text-error-700`;
export const badgeBrand = `${badgeBase} bg-brand-50 text-brand-600`;
export const badgeGray = `${badgeBase} bg-gray-100 text-gray-600`;

export const alertError =
  "rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700";
export const alertInfo =
  "rounded-lg border border-brand-200 bg-brand-25 px-4 py-3 text-sm text-brand-800";
