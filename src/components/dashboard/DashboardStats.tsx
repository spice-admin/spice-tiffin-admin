// Example: src/components/admin/DashboardStats.tsx (or wherever your revenue snippet is)
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path

const TotalRevenueStat: React.FC = () => {
  const [totalRevenue, setTotalRevenue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenue = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Ensure the function name matches what you deployed
        const { data, error: funcError } = await supabase.functions.invoke(
          "get-stripe-all-time-revenue", // Exact name of your deployed Edge Function
          {
            // method: 'POST', // Default is POST for invoke
            // headers: { 'Content-Type': 'application/json' }, // Supabase client handles this
            // body: {}, // No body needed for this GET-like function
          }
        );

        if (funcError) throw funcError;

        if (data && data.totalRevenue !== undefined) {
          setTotalRevenue(data.totalRevenue);
        } else {
          // Handle cases where data might be unexpected, e.g. { error: 'Some message' }
          throw new Error(
            data?.error ||
              "Unexpected response structure from revenue function."
          );
        }
      } catch (err: any) {
        console.error("Error invoking Stripe revenue function:", err);
        setError(err.message || "Failed to load total revenue.");
        setTotalRevenue(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRevenue();
  }, []); // Fetch once on component mount

  return (
    <div className="flex-grow-1 ms-2 text-truncate">
      {" "}
      {/* Your existing HTML structure */}
      {isLoading && (
        <h6 className="text-dark mb-0 fw-semibold fs-20">Loading...</h6>
      )}
      {!isLoading && error && (
        <h6 className="text-danger mb-0 fw-semibold fs-20" title={error}>
          Error
        </h6>
      )}
      {!isLoading && !error && totalRevenue !== null && (
        <h6 className="text-dark mb-0 fw-semibold fs-20">
          ${totalRevenue} CAD
        </h6>
      )}
      {!isLoading && !error && totalRevenue === null && (
        <h6 className="text-muted mb-0 fw-semibold fs-20">N/A</h6>
      )}
      <p className="text-muted mb-0 fw-medium fs-13">All-Time Gross Revenue</p>
    </div>
  );
};

export default TotalRevenueStat;
