// src/components/admin/stats/TotalOrdersStat.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path to your Supabase client

const TotalOrdersStat: React.FC = () => {
  const [totalOrdersCount, setTotalOrdersCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTotalOrders = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Query to get the count of all orders.
        // PostgREST returns the count in the response headers or as part of the object if using {count: 'exact'}
        const { count, error: dbError } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true }); // 'head: true' makes it only fetch the count

        if (dbError) {
          throw dbError;
        }

        console.log("Total orders count from Supabase:", count);
        setTotalOrdersCount(count ?? 0); // If count is null (e.g., no orders), default to 0
      } catch (err: any) {
        console.error("Error fetching total orders count:", err);
        setError(err.message || "Failed to load total orders.");
        setTotalOrdersCount(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTotalOrders();
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
      {!isLoading && !error && totalOrdersCount !== null && (
        <h6 className="text-dark mb-0 fw-semibold fs-20">{totalOrdersCount}</h6>
      )}
      {!isLoading && !error && totalOrdersCount === null && (
        <h6 className="text-muted mb-0 fw-semibold fs-20">N/A</h6>
      )}
      <p className="text-muted mb-0 fw-medium fs-13">
        Total Orders
        {/* Changed from "New Order" to "Total Orders" based on your request. Adjust if needed. */}
      </p>
    </div>
  );
};

export default TotalOrdersStat;
