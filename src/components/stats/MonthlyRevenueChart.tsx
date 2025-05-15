// src/components/admin/stats/MonthlyRevenueChart.tsx
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions, // Use Chart.js's ChartOptions
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MonthlyRevenueDataPoint {
  month: string;
  revenue: number;
}

interface StripeMonthlyRevenueResponse {
  monthlyRevenue: MonthlyRevenueDataPoint[];
  currency: string;
  year: number;
}

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

const MonthlyRevenueChart: React.FC = () => {
  const [apiChartData, setApiChartData] = useState<MonthlyRevenueDataPoint[]>(
    []
  );
  const [currency, setCurrency] = useState<string>("CAD");
  const [currentYear] = useState<number>(new Date().getFullYear());

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) {
      console.log("MonthlyRevenueChart: Client not ready, deferring fetch.");
      return;
    }

    const fetchMonthlyRevenue = async (year: number) => {
      setIsLoading(true);
      setError(null);
      console.log(`MonthlyRevenueChart: Fetching revenue for year: ${year}`);
      try {
        const { data, error: funcError } = await supabase.functions.invoke(
          "get-stripe-monthly-revenue-by-year",
          { body: { year: year } }
        );

        if (funcError) throw funcError;

        if (data && Array.isArray(data.monthlyRevenue)) {
          const apiResponse = data as StripeMonthlyRevenueResponse;
          setApiChartData(apiResponse.monthlyRevenue);
          setCurrency(apiResponse.currency);
        } else {
          setApiChartData([]);
          throw new Error(
            data?.error ||
              "Unexpected response structure from revenue function."
          );
        }
      } catch (err: any) {
        console.error("Error invoking Stripe monthly revenue function:", err);
        setError(err.message || "Failed to load monthly revenue.");
        setApiChartData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthlyRevenue(currentYear);
  }, [currentYear, isClient]);

  // Prepare data specifically for Chart.js
  const chartJsData: ChartData<"bar"> = useMemo(() => {
    const labels =
      apiChartData.length > 0
        ? apiChartData.map((d) => d.month)
        : MONTH_NAMES_FALLBACK;
    const revenueData =
      apiChartData.length > 0 ? apiChartData.map((d) => d.revenue) : [];

    return {
      labels: labels,
      datasets: [
        {
          label: `Revenue (${currency})`,
          data: revenueData,
          backgroundColor: "rgba(59, 130, 246, 0.7)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [apiChartData, currency]);

  // Prepare options specifically for Chart.js
  const chartJsOptions: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top" as const,
        },
        title: {
          display: false, // Title is already in the card header
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat("en-CA", {
                  style: "currency",
                  currency: currency,
                }).format(context.parsed.y);
              }
              return label;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: `Revenue (${currency})`,
            font: { weight: "500" },
          },
          ticks: {
            callback: function (value) {
              // Ensure 'this' context isn't an issue, or use regular function
              if (typeof value === "number") return value.toLocaleString();
              return value;
            },
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    }),
    [currency]
  ); // Removed currentYear from deps as title is not in options

  let chartDisplayContent;
  if (!isClient) {
    chartDisplayContent = (
      <p style={{ textAlign: "center", padding: "20px", minHeight: "350px" }}>
        Initializing chart...
      </p>
    );
  } else if (isLoading && apiChartData.length === 0) {
    chartDisplayContent = (
      <p style={{ textAlign: "center", padding: "20px", minHeight: "350px" }}>
        Loading chart data...
      </p>
    );
  } else if (error) {
    chartDisplayContent = (
      <p
        style={{
          textAlign: "center",
          padding: "20px",
          minHeight: "350px",
          color: "red",
        }}
      >
        Error: {error}
      </p>
    );
  } else if (apiChartData.length === 0 && !isLoading) {
    chartDisplayContent = (
      <p style={{ textAlign: "center", padding: "20px", minHeight: "350px" }}>
        No revenue data to display for {currentYear}.
      </p>
    );
  } else {
    chartDisplayContent = (
      <Bar
        options={chartJsOptions}
        data={chartJsData}
        height={350} // You can control height via props or container style
      />
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col">
            <h4 className="card-title">Monthly Revenue ({currentYear})</h4>
          </div>
          <div className="col-auto">
            {/* Dropdown removed as per your request */}
            <span className="text-muted fs-13">Data for {currentYear}</span>
          </div>
        </div>
      </div>
      <div className="card-body pt-0">
        <div
          id="monthly-revenue-chart-container"
          className="chartjs-chart-container"
          style={{ height: "350px", position: "relative" }}
        >
          {chartDisplayContent}
        </div>
      </div>
    </div>
  );
};

export default MonthlyRevenueChart;
