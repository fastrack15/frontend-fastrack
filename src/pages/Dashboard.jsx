import { useCallback, useState } from "react";
import DefectsCard from "../components/defects/DefectsCard";
import StatCard from "../layouts/StatCard";
import DefectChart from "../layouts/DefectChart";
import DefectBarChart from "../layouts/DefectBarChart";
import DefectPerformanceChart from "../layouts/DefectPerformanceChart";

const INITIAL_STATS = {
  total_data: 0,
  total_open: 0,
  total_onProcess: 0,
  total_close: 0,
  percentageTotal: "0.00",
  percentageOpen: "0.00",
  percentageOnProcess: "0.00",
  percentageClose: "0.00",
};

function percentage(num, denum) {
  if (!denum) return "0.00";
  return ((num / denum) * 100).toFixed(2);
}

function Dashboard() {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [chartRows, setChartRows] = useState([]);
  const [barChartRows, setBarChartRows] = useState([]);

  const handleRuasKegiatanChange = useCallback((rows) => {
    setBarChartRows(rows);
  }, []);

  // Statistik dihitung dari seluruh data yang sudah melewati semua filter tabel.
  const handleFilteredRowsChange = useCallback((filteredRows) => {
    const nextStats = filteredRows.reduce(
      (totals, row) => {
        const status = String(row.status ?? "")
          .trim()
          .toLowerCase();

        if (status === "open") {
          totals.total_open += 1;
        } else if (status === "on process") {
          totals.total_onProcess += 1;
        } else if (status === "close") {
          totals.total_close += 1;
        }
        return totals;
      },
      { ...INITIAL_STATS },
    );

    nextStats.total_data =
      nextStats.total_open + nextStats.total_onProcess + nextStats.total_close;

    nextStats.percentageTotal = percentage(
      nextStats.total_data,
      nextStats.total_data,
    );
    nextStats.percentageOpen = percentage(
      nextStats.total_open,
      nextStats.total_data,
    );
    nextStats.percentageOnProcess = percentage(
      nextStats.total_onProcess,
      nextStats.total_data,
    );
    nextStats.percentageClose = percentage(
      nextStats.total_close,
      nextStats.total_data,
    );

    setChartRows(filteredRows);
    setStats(nextStats);
  }, []);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        <StatCard
          title="Total Defect"
          value={stats.total_data}
          percentage={stats.percentageTotal}
          loading={false}
          color={"c1"}
          icon="triangle-exclamation"
        />
        <StatCard
          title="Open"
          value={stats.total_open}
          percentage={stats.percentageOpen}
          loading={false}
          color={"c4"}
          icon="circle-xmark"
        />
        <StatCard
          title="On Process"
          value={stats.total_onProcess}
          percentage={stats.percentageOnProcess}
          loading={false}
          color={"c3"}
          icon="hourglass-half"
        />
        <StatCard
          title="Close"
          value={stats.total_close}
          percentage={stats.percentageClose}
          loading={false}
          color={"c2"}
          icon="circle-check"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_minmax(0,1fr)] md:gap-6 xl:grid-cols-[220px_minmax(0,1.2fr)_minmax(0,1fr)]">
        <DefectPerformanceChart rows={chartRows} />
        <DefectBarChart rows={barChartRows} />
        <div className="md:col-span-2 xl:col-span-1">
          <DefectChart rows={chartRows} />
        </div>
      </div>

      <DefectsCard
        onFilteredRowsChange={handleFilteredRowsChange}
        onRuasKegiatanChange={handleRuasKegiatanChange}
      />
    </div>
  );
}

export default Dashboard;
