import { useMemo } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CATEGORIES = [
  { lingkup: "Highway", jalur: "Jalur A", label: ["Highway", "Jalur A"] },
  { lingkup: "Highway", jalur: "Jalur B", label: ["Highway", "Jalur B"] },
  { lingkup: "Struktur", jalur: "Jalur A", label: ["Struktur", "Jalur A"] },
  { lingkup: "Struktur", jalur: "Jalur B", label: ["Struktur", "Jalur B"] },
  { lingkup: "Sarkapja", jalur: "Jalur A", label: ["Sarkapja", "Jalur A"] },
  { lingkup: "Sarkapja", jalur: "Jalur B", label: ["Sarkapja", "Jalur B"] },
];

function normalize(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function DefectBarChart({ rows = [], loading = false }) {
  const counts = useMemo(() => {
    return CATEGORIES.map((category) => {
      return rows.filter(
        (row) =>
          normalize(row.lingkup) === normalize(category.lingkup) &&
          normalize(row.jalur) === normalize(category.jalur),
      ).length;
    });
  }, [rows]);

  const data = {
    labels: CATEGORIES.map((item) => item.label),
    datasets: [
      {
        label: "Jumlah Defect",
        data: counts,
        backgroundColor: [
          "#2f3585",
          "#2f6fe6",
          "#17a2b8",
          "#20a464",
          "#f5a20a",
          "#7b3fd9",
        ],
        borderRadius: 5,
        maxBarThickness: 35,
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
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y} defect`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          stepSize: 1,
        },
        title: {
          display: true,
          text: "Jumlah Defect",
        },
      },
      x: {
        ticks: {
          autoSkip: false,
        },
      },
    },
  };

  return (
    <div className="flex h-full min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs sm:p-5">
      <h2 className="mb-3 text-center text-base font-semibold text-gray-800">
        Defect Berdasarkan Lingkup & Jalur
      </h2>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500">
          Memuat grafik...
        </p>
      ) : (
        // Di layar sempit grafik digeser horizontal agar label tidak bertumpuk.
        <div className="min-h-40 flex-1 overflow-x-auto">
          <div className="relative h-full min-h-64 min-w-[380px] sm:min-w-0">
            <Bar data={data} options={options} />
          </div>
        </div>
      )}
    </div>
  );
}

export default DefectBarChart;
