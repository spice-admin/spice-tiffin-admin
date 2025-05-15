// src/components/admin/stats/TopSellingPackages.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path to your Supabase client

interface TopPackageData {
  package_name: string;
  order_count: number;
}

interface DisplayPackageData extends TopPackageData {
  percentage: number; // Relative to the top seller
}

const TopSellingPackages: React.FC = () => {
  const [topPackages, setTopPackages] = useState<DisplayPackageData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopSellingPackages = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch package counts directly using an RPC call for aggregation
        // This is generally more performant for aggregations than fetching all orders client-side.
        // You would create this PostgreSQL function in your Supabase SQL editor.
        const { data, error: rpcError } = await supabase.rpc(
          "get_top_selling_packages",
          { limit_count: 5 } // Pass how many top packages you want
        );

        if (rpcError) {
          console.error(
            "Error calling RPC get_top_selling_packages:",
            rpcError
          );
          throw rpcError;
        }

        if (data && Array.isArray(data) && data.length > 0) {
          const fetchedPackages: TopPackageData[] = data;

          // Calculate percentage relative to the top seller for the progress bar
          const maxCount = fetchedPackages[0].order_count; // Assuming data is sorted by count desc
          const displayData: DisplayPackageData[] = fetchedPackages.map(
            (pkg) => ({
              ...pkg,
              percentage:
                maxCount > 0
                  ? Math.round((pkg.order_count / maxCount) * 100)
                  : 0,
            })
          );
          setTopPackages(displayData);
        } else {
          setTopPackages([]);
        }
      } catch (err: any) {
        console.error("Error fetching top selling packages:", err);
        setError(err.message || "Failed to load top selling packages.");
        setTopPackages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopSellingPackages();
  }, []); // Fetch once on component mount

  return (
    <div className="card">
      {" "}
      {/* Using your existing card structure */}
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col">
            <h4 className="card-title">
              Top Selling Packages (by Order Count)
            </h4>
          </div>
          {/* No dropdown filter for this specific card in your example */}
        </div>
      </div>
      <div className="card-body pt-0">
        {isLoading && (
          <p
            className="loading-placeholder"
            style={{ padding: "20px", textAlign: "center" }}
          >
            Loading top packages...
          </p>
        )}
        {!isLoading && error && (
          <p
            className="error-message"
            style={{ padding: "20px", textAlign: "center", color: "red" }}
          >
            Error: {error}
          </p>
        )}
        {!isLoading && !error && topPackages.length === 0 && (
          <p style={{ padding: "20px", textAlign: "center" }}>
            No package sales data available.
          </p>
        )}
        {!isLoading && !error && topPackages.length > 0 && (
          <div className="table-responsive">
            <table className="table mb-0">
              <tbody>
                {topPackages.map((pkg) => (
                  <tr key={pkg.package_name}>
                    <td className="px-0">
                      <div className="d-flex align-items-center">
                        <div className="flex-grow-1 text-truncate">
                          <h6 className="m-0 text-truncate fs-13">
                            {pkg.package_name}
                          </h6>
                          <div className="d-flex align-items-center">
                            <div
                              className="progress bg-primary-subtle w-100" // Assuming Bootstrap classes
                              style={{ height: "4px" }} // Made progress bar a bit thicker
                              role="progressbar"
                              aria-valuenow={pkg.percentage}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <div
                                className="progress-bar bg-primary" // Assuming Bootstrap classes
                                style={{ width: `${pkg.percentage}%` }}
                              ></div>
                            </div>
                            <small className="flex-shrink-1 ms-2">
                              {pkg.percentage}%
                            </small>{" "}
                            {/* Percentage next to bar */}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-0 text-end">
                      <span className="text-body ps-2 align-self-center text-end fw-medium">
                        {pkg.order_count} Orders
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopSellingPackages;
