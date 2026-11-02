import { useMemo } from "react";
import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const COLORS = [
  "#2f3585",
  "#2f6fe6",
  "#a8e0ff",
  "#f5a20a",
  "#7b3fd9",
  "#6b7894",
  "#17a2b8",
  "#e83e8c",
];

const toTitleCase = (text) =>
  text.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));

function groupByType(rows, field, maxSlices) {
  const counts = new Map();

  rows.forEach((row) => {
    const raw = String(row?.[field] ?? "")
      .replace(/\s+/g, " ")
      .trim();

    const key =
      raw === "" || raw === "-" ? "tidak diketahui" : raw.toLowerCase();

    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, maxSlices);
  const otherTotal = sorted
    .slice(maxSlices)
    .reduce((sum, [, count]) => sum + count, 0);

  const entries = top.map(([key, count]) => [toTitleCase(key), count]);

  if (otherTotal > 0) {
    entries.push(["Lainnya", otherTotal]);
  }

  return entries;
}

function DefectChart({
  rows = [],
  field = "temuan",
  title = "Jenis Defect",
  maxSlices = 6,
  loading = false,
}) {
  const entries = useMemo(
    () => groupByType(rows, field, maxSlices),
    [rows, field, maxSlices],
  );

  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  const data = {
    labels: entries.map(([label]) => label),
    datasets: [
      {
        data: entries.map(([, count]) => count),
        backgroundColor: entries.map(
          (_, index) => COLORS[index % COLORS.length],
        ),
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.parsed} defect`,
        },
      },
      datalabels: {
        color: "#ffffff",
        font: {
          weight: "bold",
          size: 13,
        },
        formatter: (value) =>
          total ? `${Math.round((value / total) * 100)}%` : "",
        display: (ctx) =>
          total > 0 && ctx.dataset.data[ctx.dataIndex] / total >= 0.04,
      },
    },
  };

  return (
    <div className="h-full min-w-0 rounded-2xl border border-gray-200 bg-white shadow-theme-xs">
      <div className="@container flex h-full items-center p-4 sm:p-5">
        {loading ? (
          <p className="my-auto w-full text-center text-sm text-gray-500">
            Memuat grafik...
          </p>
        ) : total === 0 ? (
          <p className="my-auto w-full text-center text-sm text-gray-500">
            Belum ada data.
          </p>
        ) : (
          <div className="grid w-full min-w-0 grid-cols-1 items-center gap-4 @sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            {/* Grafik pie */}
            <div className="relative mx-auto h-52 w-full max-w-[300px] min-w-0 @sm:h-56">
              <Pie data={data} options={options} plugins={[ChartDataLabels]} />
            </div>

            {/* Judul dan legend */}
            <div className="min-w-0">
              <h2 className="mb-3 text-base font-semibold text-gray-800">
                {title}
              </h2>

              <ul className="space-y-2.5">
                {entries.map(([label], index) => (
                  <li key={label} className="flex items-start gap-2 text-sm">
                    <span
                      className="mt-1 size-3 shrink-0 rounded-sm"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span
                      className="min-w-0 wrap-anywhere text-gray-700"
                      title={label}
                    >
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DefectChart;
