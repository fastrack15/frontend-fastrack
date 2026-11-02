import { useMemo } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

// Tanggal lokal YYYY-MM-DD (sama dengan filter Schedule di DefectsCard).
function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Performance = (1 - (data Open/On Process yang melewati target) / total defect) x 100
//
// - Total defect: data berstatus Open, On Process, atau Close
//   (sama dengan kartu "Total Defect").
// - Melewati target: status Open atau On Process dan hari ini > target.
//   Data tanpa target tidak dihitung terlambat.
function calculatePerformance(rows) {
  const todayKey = toDateKey(new Date());
  let total = 0;
  let overdue = 0;

  rows.forEach((row) => {
    const status = String(row.status ?? "")
      .trim()
      .toLowerCase();
    const isActive = status === "open" || status === "on process";

    if (!isActive && status !== "close") return;

    total += 1;

    const targetKey = row.target ? String(row.target).slice(0, 10) : "";

    if (isActive && targetKey !== "" && todayKey > targetKey) {
      overdue += 1;
    }
  });

  return {
    total,
    overdue,
    performance: total === 0 ? null : (1 - overdue / total) * 100,
  };
}

function DefectPerformanceChart({ rows = [], loading = false }) {
  const { total, overdue, performance } = useMemo(
    () => calculatePerformance(rows),
    [rows],
  );

  const data = {
    labels: ["Performance"],
    datasets: [
      {
        label: "Performance",
        data: [performance ?? 0],
        backgroundColor: "#465fff",
        borderRadius: 6,
        maxBarThickness: 72,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 24 } },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y.toFixed(2)}%`,
        },
      },
      datalabels: {
        anchor: "end",
        align: "end",
        color: "#1d2939",
        font: { weight: "bold", size: 13 },
        formatter: (value) => `${value.toFixed(2)}%`,
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 25,
          callback: (value) => `${value}%`,
        },
      },
    },
  };

  const summary =
    performance === null
      ? "Belum ada data"
      : `Performance ${performance.toFixed(2)}%: ${overdue} dari ${total} data melewati target`;

  return (
    <div className="flex h-full min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs sm:p-5">
      <h2 className="mb-3 text-center text-base font-semibold text-gray-800">
        Performance
      </h2>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500">
          Memuat grafik...
        </p>
      ) : performance === null ? (
        <p className="my-auto py-10 text-center text-sm text-gray-500">
          Belum ada data.
        </p>
      ) : (
        <>
          <div
            className="relative min-h-40 flex-1"
            role="img"
            aria-label={summary}
          >
            <Bar data={data} options={options} plugins={[ChartDataLabels]} />
          </div>
        </>
      )}
    </div>
  );
}

export default DefectPerformanceChart;
