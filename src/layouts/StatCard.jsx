// Warna kartu dipilih lewat prop `color` (c1..c4), sama seperti sebelumnya.
const TONES = {
  c1: { icon: "bg-brand-50 text-brand-500", badge: "bg-brand-50 text-brand-600" },
  c2: { icon: "bg-success-50 text-success-600", badge: "bg-success-50 text-success-700" },
  c3: { icon: "bg-warning-50 text-warning-600", badge: "bg-warning-50 text-warning-700" },
  c4: { icon: "bg-error-50 text-error-600", badge: "bg-error-50 text-error-700" },
};

function StatCard({ title, percentage, value, loading, color, icon }) {
  const tone = TONES[color] ?? TONES.c1;

  return (
    <article className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs">
      <span
        className={`flex size-10 items-center justify-center rounded-xl ${tone.icon}`}
      >
        <i className={`fa-solid fa-${icon} text-lg`} aria-hidden="true" />
      </span>

      <p className="mt-3 text-sm text-gray-500">{title}</p>

      <div className="mt-1 flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
        <p className="text-2xl font-semibold tabular-nums text-gray-800">
          {loading ? "..." : value}
        </p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${tone.badge}`}
        >
          {percentage}%
        </span>
      </div>
    </article>
  );
}

export default StatCard;
