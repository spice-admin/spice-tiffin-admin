// src/components/admin/reports/SalesReportsView.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import "chartjs-adapter-date-fns";
import {
  format,
  parseISO,
  isValid,
  startOfDay,
  endOfDay,
  subDays,
  // startOfWeek, // Not used yet
  // endOfWeek,   // Not used yet
  startOfMonth,
  endOfMonth,
  subMonths, // For Last Month
  startOfYear,
  endOfYear,
} from "date-fns";

// Register Chart.js components needed
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

// Types for data from Edge Function
interface PackageSaleStatItem {
  period_label: string; // e.g., "2025-05-28", "May 2025", "Package X" (if periodType is total)
  package_name: string; // Could be "All Packages" if period_label is a date for total daily sales
  sales_count: number;
}
interface OverallStatSummary {
  total_sales_current_period: number;
  top_package_current_period: string | null;
}
interface SalesReportResponse {
  success: boolean;
  salesData?: PackageSaleStatItem[];
  summaryStats?: OverallStatSummary;
  periodType?: string; // Echoed back for context
  requestedStartDate?: string;
  requestedEndDate?: string;
  error?: string;
}

// Type for the payload sent to the Edge Function
interface RequestPayload {
  periodType: "daily" | "weekly" | "monthly" | "custom_range" | "total";
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

// Fallback for chart categories if data is empty for certain views
const MONTH_NAMES_FALLBACK = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type ActiveFilterType =
  | "today"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "allTime"
  | "custom";

const SalesReportsView: React.FC = () => {
  const [isClient, setIsClient] = useState(false);

  const [activeFilter, setActiveFilter] = useState<ActiveFilterType>("last7");
  const [customStartDate, setCustomStartDate] = useState<string>(
    format(subDays(new Date(), 6), "yyyy-MM-dd")
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );

  const [salesDataForChart, setSalesDataForChart] = useState<
    PackageSaleStatItem[]
  >([]);
  const [summaryStats, setSummaryStats] = useState<OverallStatSummary | null>(
    null
  );
  const [chartTitle, setChartTitle] = useState<string>("Package Sales Trend");
  const [currentYear, setCurrentYear] = useState<number>(
    new Date().getFullYear()
  );
  const [displayCurrency] = useState<string>("CAD"); // Assuming fixed for now

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const fetchSalesData = useCallback(async () => {
    if (!isClient) return;
    setIsLoading(true);
    setError(null);
    // setSalesDataForChart([]); // Clear previous data, or let it persist while loading
    // setSummaryStats(null);

    let payload: RequestPayload;
    let newChartTitle = "Package Sales Trend";
    const today = startOfDay(new Date());

    switch (activeFilter) {
      case "today":
        payload = {
          periodType: "daily", // Your EF needs to handle this to give daily data for one day
          startDate: format(today, "yyyy-MM-dd"),
          endDate: format(today, "yyyy-MM-dd"),
        };
        newChartTitle = `Sales for Today (${format(today, "MMM dd")})`;
        break;
      case "last7":
        payload = {
          periodType: "custom_range", // Expecting daily breakdown from EF
          startDate: format(subDays(today, 6), "yyyy-MM-dd"),
          endDate: format(today, "yyyy-MM-dd"),
        };
        newChartTitle = "Sales - Last 7 Days (Daily)";
        break;
      case "last30":
        payload = {
          periodType: "custom_range", // Expecting daily breakdown from EF
          startDate: format(subDays(today, 29), "yyyy-MM-dd"),
          endDate: format(today, "yyyy-MM-dd"),
        };
        newChartTitle = "Sales - Last 30 Days (Daily)";
        break;
      case "thisMonth":
        payload = {
          periodType: "custom_range", // Expecting daily breakdown for the month from EF
          startDate: format(startOfMonth(today), "yyyy-MM-dd"),
          endDate: format(endOfMonth(today), "yyyy-MM-dd"),
        };
        newChartTitle = `Sales - ${format(today, "MMMM yyyy")}`;
        break;
      case "lastMonth":
        const firstDayLastMonth = startOfMonth(subMonths(today, 1));
        payload = {
          periodType: "custom_range", // Expecting daily breakdown for last month
          startDate: format(firstDayLastMonth, "yyyy-MM-dd"),
          endDate: format(endOfMonth(firstDayLastMonth), "yyyy-MM-dd"),
        };
        newChartTitle = `Sales - ${format(firstDayLastMonth, "MMMM yyyy")}`;
        break;
      case "thisYear":
        payload = {
          // EF should return monthly aggregated data for this
          periodType: "monthly", // Explicitly ask EF for monthly for the year
          startDate: format(startOfYear(today), "yyyy-MM-dd"), // Pass year range
          endDate: format(endOfYear(today), "yyyy-MM-dd"),
        };
        newChartTitle = `Monthly Sales - ${format(today, "yyyy")}`;
        break;
      case "allTime":
        payload = { periodType: "total" };
        newChartTitle = "All-Time Top Selling Packages";
        break;
      case "custom":
        if (
          !isValid(parseISO(customStartDate)) ||
          !isValid(parseISO(customEndDate)) ||
          parseISO(customStartDate) > parseISO(customEndDate)
        ) {
          setError("Invalid custom date range.");
          setIsLoading(false);
          return;
        }
        payload = {
          periodType: "custom_range",
          startDate: customStartDate,
          endDate: customEndDate,
        };
        newChartTitle = `Sales: ${format(
          parseISO(customStartDate),
          "MMM dd"
        )} - ${format(parseISO(customEndDate), "MMM dd, yyyy")}`;
        break;
      default:
        console.error("Unknown filter type:", activeFilter);
        setIsLoading(false);
        return;
    }
    setChartTitle(newChartTitle);

    console.log("Fetching sales data with payload:", payload);

    try {
      const { data, error: funcError } =
        await supabase.functions.invoke<SalesReportResponse>(
          "get-package-sales-stats",
          { body: payload }
        );

      if (funcError) throw funcError;
      if (!data || !data.success) {
        throw new Error(
          data?.error || "Failed to fetch sales report data from function."
        );
      }

      console.log("Sales report data received:", data);
      setSalesDataForChart(data.salesData || []);
      setSummaryStats(data.summaryStats || null);
    } catch (err: any) {
      console.error("Error invoking sales report function:", err);
      setError(err.message || "Failed to load sales report.");
      setSalesDataForChart([]);
      setSummaryStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [isClient, activeFilter, customStartDate, customEndDate]);

  useEffect(() => {
    if (isClient) {
      fetchSalesData();
    }
  }, [isClient, fetchSalesData]);

  const chartJsDataAndType = useMemo((): {
    data: ChartData<"bar" | "line">;
    type: "bar" | "line";
  } => {
    let labels: string[] = [];
    let datasetData: number[] = [];
    let chartType: "bar" | "line" = "bar"; // Default to bar
    const currentData = salesDataForChart || [];

    // For filters that show package breakdown over their respective period (bar chart)
    if (
      [
        "today",
        "last7",
        "last30",
        "thisMonth",
        "lastMonth",
        "allTime",
        "custom",
      ].includes(activeFilter)
    ) {
      chartType = "bar";
      const packageCounts: Record<string, number> = {};
      currentData.forEach((item) => {
        // item.period_label will be specific if data is daily, or a range if EF aggregated over range
        // For these filters, we sum up all sales_count for each package_name regardless of daily period_label
        packageCounts[item.package_name] =
          (packageCounts[item.package_name] || 0) + item.sales_count;
      });
      const sortedPackages = Object.entries(packageCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10); // Show top 10 packages for the period

      labels = sortedPackages.map((entry) => entry[0]);
      datasetData = sortedPackages.map((entry) => entry[1]);

      // If no packages were found for the period, make sure chart doesn't break
      if (labels.length === 0) {
        labels = ["No package data"];
        datasetData = [0];
      }
    } else if (activeFilter === "thisYear") {
      // "This Year" specifically aims for a monthly trend (line or bar)
      // This assumes your EF, when periodType is 'monthly' (triggered by 'thisYear' filter),
      // returns salesData where period_label is "YYYY-MM" or a month name, and sales_count is total for that month.
      chartType = "line"; // Or 'bar' if you prefer monthly bars
      labels = MONTH_NAMES_FALLBACK;
      const monthlyDataMap = new Map<string, number>();
      currentData.forEach((item) => {
        // Assuming EF returns period_label as "Jan", "Feb" or "YYYY-01", "YYYY-02" for monthly data
        // For simplicity, let's assume EF for 'thisYear'/'monthly' returns period_label as "Jan", "Feb", ...
        // or we need to parse YYYY-MM from item.period_label
        const monthName = item.period_label; // This needs to match what EF sends for monthly
        monthlyDataMap.set(
          monthName,
          (monthlyDataMap.get(monthName) || 0) + item.sales_count
        );
      });

      // If using MONTH_NAMES_FALLBACK, ensure the data maps correctly
      datasetData = MONTH_NAMES_FALLBACK.map(
        (month) => monthlyDataMap.get(month) || 0
      );

      if (datasetData.every((val) => val === 0) && currentData.length > 0) {
        // This means mapping failed, perhaps period_label from EF for monthly isn't matching "Jan", "Feb", etc.
        // Fallback to showing packages if monthly mapping is tricky
        console.warn(
          "Monthly data mapping might have issues, consider EF output for 'thisYear'. Showing package breakdown instead."
        );
        chartType = "bar";
        const packageCounts: Record<string, number> = {};
        currentData.forEach((item) => {
          packageCounts[item.package_name] =
            (packageCounts[item.package_name] || 0) + item.sales_count;
        });
        const sortedPackages = Object.entries(packageCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10);
        labels = sortedPackages.map((entry) => entry[0]);
        datasetData = sortedPackages.map((entry) => entry[1]);
      }
    } else {
      // Should not be reached if activeFilter is always one of the above
      labels = ["Select a filter"];
      datasetData = [0];
    }

    return {
      type: chartType,
      data: {
        labels: labels.length > 0 ? labels : ["N/A"],
        datasets: [
          {
            label: chartType === "line" ? "Daily Sales Total" : "Packages Sold",
            data: datasetData.length > 0 ? datasetData : [0],
            backgroundColor:
              chartType === "line"
                ? "rgba(75, 192, 192, 0.5)"
                : "rgba(59, 130, 246, 0.7)",
            borderColor:
              chartType === "line" ? "rgb(75, 192, 192)" : "rgb(59, 130, 246)",
            borderWidth: chartType === "line" ? 2 : 1,
            borderRadius: chartType === "bar" ? 4 : 0,
            fill: chartType === "line",
            tension: chartType === "line" ? 0.2 : undefined,
            pointRadius: chartType === "line" ? 3 : undefined,
            pointBackgroundColor:
              chartType === "line" ? "rgb(75, 192, 192)" : undefined,
          },
        ],
      },
    };
  }, [salesDataForChart, activeFilter, currentYear]); // Added currentYear for 'thisYear' label processing

  const chartJsOptions: ChartOptions<"bar" | "line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: chartJsDataAndType.data.datasets.length > 0,
          position: "top" as const,
        },
        title: { display: true, text: chartTitle, font: { size: 16 } },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) label += ": ";
              if (context.parsed.y !== null) label += context.parsed.y;
              return label;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Number of Sales" },
        },
        x: {
          grid: { display: false },
          type: "category", // For string labels like package names or formatted dates ('MMM dd')
          ticks: {
            maxRotation:
              activeFilter === "last30" || activeFilter === "custom" ? 70 : 0,
            minRotation:
              activeFilter === "last30" || activeFilter === "custom" ? 45 : 0,
          },
        },
      },
    }),
    [chartTitle, displayCurrency, activeFilter, chartJsDataAndType.type]
  ); // Added activeFilter & chartType

  const FilterButton: React.FC<{
    filterType: ActiveFilterType;
    label: string;
  }> = ({ filterType, label }) => (
    <button
      onClick={() => {
        setActiveFilter(filterType);
      }}
      className={
        activeFilter === filterType ? "filter-button active" : "filter-button"
      }
      disabled={isLoading}
    >
      {label}
    </button>
  );

  let chartDisplayContent;
  if (!isClient) {
    chartDisplayContent = (
      <p className="report-placeholder" style={{ minHeight: "350px" }}>
        Initializing Reports...
      </p>
    );
  } else if (isLoading && salesDataForChart.length === 0) {
    // Show loading only when there's no stale data
    chartDisplayContent = (
      <p className="report-loading" style={{ minHeight: "350px" }}>
        Loading report data...
      </p>
    );
  } else if (error) {
    chartDisplayContent = (
      <p className="report-error" style={{ minHeight: "350px" }}>
        Error: {error}
      </p>
    );
  } else if (
    chartJsDataAndType.data.datasets[0].data.length === 0 &&
    !isLoading
  ) {
    chartDisplayContent = (
      <p className="report-placeholder" style={{ minHeight: "350px" }}>
        No sales data available for this period.
      </p>
    );
  } else {
    const ChartComponent = chartJsDataAndType.type === "line" ? Line : Bar;
    chartDisplayContent = (
      <ChartComponent
        options={chartJsOptions}
        data={chartJsDataAndType.data}
        height={350}
      />
    );
  }

  return (
    <div className="sales-reports-view">
      <div className="report-filters">
        <FilterButton filterType="today" label="Today" />
        <FilterButton filterType="last7" label="Last 7 Days" />
        <FilterButton filterType="last30" label="Last 30 Days" />
        <FilterButton filterType="thisMonth" label="This Month" />
        <FilterButton filterType="lastMonth" label="Last Month" />
        <FilterButton filterType="thisYear" label="This Year" />
        <FilterButton filterType="allTime" label="All Time" />
        <button
          onClick={() => setActiveFilter("custom")}
          className={
            activeFilter === "custom" ? "filter-button active" : "filter-button"
          }
          disabled={isLoading}
        >
          Custom
        </button>
        {activeFilter === "custom" && (
          <div className="custom-date-range-picker">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              disabled={isLoading}
            />
            <span>to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              disabled={isLoading}
            />
            <button
              onClick={fetchSalesData}
              disabled={isLoading}
              className="filter-button apply-custom-btn"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {!isLoading && !error && summaryStats && (
        <div className="summary-stats-grid">
          <div className="stat-card-item">
            <h4>{summaryStats.total_sales_current_period}</h4>
            <p>Total Packages Sold (Selected Period)</p>
          </div>
          <div className="stat-card-item">
            <h4>{summaryStats.top_package_current_period || "N/A"}</h4>
            <p>Top Package (Selected Period)</p>
          </div>
        </div>
      )}

      <div
        className="chart-container"
        style={{ minHeight: "400px", position: "relative" }}
      >
        {chartDisplayContent}
      </div>
    </div>
  );
};

export default SalesReportsView;
