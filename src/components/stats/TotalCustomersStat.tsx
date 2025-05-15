// src/components/admin/stats/TotalCustomersStat.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path

const TotalCustomersStat: React.FC = () => {
  const [totalCustomers, setTotalCustomers] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomerCount = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: funcError } = await supabase.functions.invoke(
          "get-stripe-customer-count" // Exact name of your deployed Edge Function
          // No body needed for this function
        );

        if (funcError) throw funcError;

        if (data && typeof data.totalCustomers === "number") {
          setTotalCustomers(data.totalCustomers);
        } else {
          throw new Error(
            data?.error || "Unexpected response from customer count function."
          );
        }
      } catch (err: any) {
        console.error("Error invoking Stripe customer count function:", err);
        setError(err.message || "Failed to load total customers.");
        setTotalCustomers(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerCount();
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
      {!isLoading && !error && totalCustomers !== null && (
        <h6 className="text-dark mb-0 fw-semibold fs-20">{totalCustomers}</h6>
      )}
      {!isLoading && !error && totalCustomers === null && (
        <h6 className="text-muted mb-0 fw-semibold fs-20">N/A</h6>
      )}
      <p className="text-muted mb-0 fw-medium fs-13">
        Stripe Customers {/* Updated Label */}
      </p>
    </div>
  );
};

export default TotalCustomersStat;
