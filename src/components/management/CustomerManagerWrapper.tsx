// src/components/management/CustomerManagerWrapper.tsx (Admin Panel)
import React, { useState, useEffect, useCallback } from "react";
import type { ICustomerAdminFE } from "../../types"; // Use admin customer type
import { getAllCustomersAdminApi } from "../../services/customer.service"; // Import admin service function
import CustomerTable from "./CustomerTable"; // Import the table component

// --- The Wrapper Component ---
const CustomerManagerWrapper: React.FC = () => {
  // State for customers, loading, and errors
  const [customers, setCustomers] = useState<ICustomerAdminFE[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch customers function
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[CustomerManagerWrapper] Fetching all customers...");
      const result = await getAllCustomersAdminApi(); // Call the admin API function
      if (result.success && Array.isArray(result.data)) {
        console.log(
          `[CustomerManagerWrapper] Fetched ${result.data.length} customers.`
        );
        setCustomers(result.data);
      } else {
        throw new Error(
          result.message || "Failed to fetch customers or invalid data format."
        );
      }
    } catch (err) {
      console.error("[CustomerManagerWrapper] Error fetching customers:", err);
      setError((err as Error).message);
      setCustomers([]); // Clear customers on error
    } finally {
      setIsLoading(false);
      console.log("[CustomerManagerWrapper] Finished fetching customers.");
    }
  }, []);

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // TODO: Add handlers for actions later (view details, update status, delete)

  return (
    <div className="card">
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col">
            <h4 className="card-title">Manage Customers</h4>{" "}
            {/* Updated title */}
          </div>
          <div className="col-auto">
            {/* Placeholder for Add button - functionality not implemented yet */}
            <button
              className="btn btn-sm btn-primary"
              disabled={true} // Enable later if needed
            >
              <i className="fas fa-plus me-1"></i>
              Add Customer
            </button>
          </div>
        </div>
      </div>
      <div className="card-body pt-0">
        {/* Display error message if fetch failed */}
        {error && (
          <div className="alert alert-danger" role="alert">
            Error fetching customers: {error}
            {/* Optional: Add retry button */}
            <button
              onClick={fetchCustomers}
              className="btn btn-sm btn-danger ms-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Pass fetched customers and loading state to table */}
        {/* Ensure CustomerTable component can handle ICustomerAdminFE type */}
        <CustomerTable customers={customers} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default CustomerManagerWrapper;
