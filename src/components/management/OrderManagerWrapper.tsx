// src/components/management/OrderManagerWrapper.tsx
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path
import {
  type IAdminOrder,
  type IOrderFilters,
  type IPaginationData,
  AdminOrderStatus,
} from "../../types"; // Use new types
import OrderTable from "./OrderTable";
import OrderDetailModal from "./OrderDetailModal";

const ITEMS_PER_PAGE = 10;

const OrderManagerWrapper: React.FC = () => {
  const [orders, setOrders] = useState<IAdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [limit, setLimit] = useState<number>(ITEMS_PER_PAGE);

  const [filters, setFilters] = useState<IOrderFilters>({
    status: "",
    search: "",
    sortBy: "order_date_desc", // Default sort: newest orders first
  });

  const [selectedOrder, setSelectedOrder] = useState<IAdminOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchOrders = useCallback(
    async (pageToFetch: number, currentFilters: IOrderFilters) => {
      setIsLoading(true);
      setError(null);
      try {
        const offset = (pageToFetch - 1) * limit;

        let query = supabase.from("orders").select(
          `
            id, user_id, user_full_name, user_email, user_phone,
            package_id, package_name, package_type, package_days, package_price,
            delivery_address, delivery_city, delivery_postal_code, delivery_current_location,
            stripe_payment_id, stripe_customer_id,
            order_status, order_date, delivery_start_date, delivery_end_date,
            created_at, updated_at
          `,
          { count: "exact" }
        );

        // --- Filtering ---
        if (currentFilters.status) {
          query = query.eq("order_status", currentFilters.status);
        }
        if (currentFilters.search) {
          const searchTerm = `%${currentFilters.search}%`;
          query = query.or(
            `id.ilike.${searchTerm},user_full_name.ilike.${searchTerm},user_email.ilike.${searchTerm},package_name.ilike.${searchTerm},stripe_payment_id.ilike.${searchTerm}`
          );
        }

        // --- CORRECTED Sorting ---
        let sortColumn: keyof IAdminOrder = "order_date"; // Default column
        let sortAscending = false; // Default to descending for order_date

        if (currentFilters.sortBy) {
          const parts = currentFilters.sortBy.split("_");
          const direction = parts.pop(); // Removes and returns 'asc' or 'desc'
          const column = parts.join("_"); // Joins the remaining parts, e.g., "order_date" or "package_price"

          // Basic validation that column and direction were extracted
          if (column && (direction === "asc" || direction === "desc")) {
            // A whitelist of sortable columns is safer to prevent errors if sortBy string is unexpected
            const allowedSortColumns: (keyof IAdminOrder)[] = [
              "order_date",
              "package_price",
              "user_full_name" /* add others as needed */,
            ];
            if (allowedSortColumns.includes(column as keyof IAdminOrder)) {
              sortColumn = column as keyof IAdminOrder;
              sortAscending = direction === "asc";
            } else {
              console.warn(
                `[OrderManagerWrapper] Invalid sort column detected: ${column}. Defaulting to order_date.`
              );
              // Defaults are already set (order_date, descending)
            }
          } else {
            console.warn(
              `[OrderManagerWrapper] Malformed sortBy string: ${currentFilters.sortBy}. Defaulting to order_date.`
            );
          }
        }

        query = query.order(sortColumn, { ascending: sortAscending });
        // --- End of Corrected Sorting ---

        // --- Pagination ---
        query = query.range(offset, offset + limit - 1);

        const { data, error: fetchError, count } = await query;

        console.log(
          "[OrderManagerWrapper] Supabase raw response - data:",
          data
        );
        console.log(
          "[OrderManagerWrapper] Supabase raw response - error object:",
          fetchError
        );
        console.log(
          "[OrderManagerWrapper] Supabase raw response - count:",
          count
        );

        if (fetchError) throw fetchError;

        if (data) {
          setOrders(data as IAdminOrder[]);
          setTotalOrders(count || 0);
          setTotalPages(Math.ceil((count || 0) / limit));
          setCurrentPage(pageToFetch);
        } else {
          setOrders([]);
          setTotalOrders(0);
          setTotalPages(0);
        }
      } catch (err) {
        console.error("[OrderManagerWrapper] Error fetching orders:", err);
        // The actual error object `err` might contain the specific PostgreSQL error like "column orders.order does not exist"
        // If err.message already contains it, great. Otherwise, you might need to inspect err further if it's a Supabase specific error object.
        setError(
          (err as any).message ||
            "An unknown error occurred while fetching orders."
        );
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchOrders(currentPage, filters);
  }, [fetchOrders, currentPage, filters]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  // No need for handleSearchSubmit if filter change already triggers useEffect
  // const handleSearchSubmit = (e?: React.FormEvent) => { ... }

  // Function to be passed to OrderTable for refreshing data (e.g., after an update)
  const refreshOrders = () => {
    fetchOrders(currentPage, filters);
  };

  const handleViewOrderDetails = (order: IAdminOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null); // Important to clear selected order
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col">
            <h4 className="card-title">All Customer Orders</h4>
          </div>
          <div className="col-auto">
            {" "}
            {/* Filter Controls Area */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchOrders(1, filters);
              }}
              className="d-inline-flex me-2"
            >
              <input
                type="text"
                name="search"
                className="form-control form-control-sm"
                placeholder="Search..."
                value={filters.search}
                onChange={handleFilterChange}
              />
              <button type="submit" className="btn btn-sm btn-primary ms-1">
                Search
              </button>
            </form>
            <select
              name="status"
              className="form-select form-select-sm d-inline-block"
              style={{ width: "auto" }}
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              {Object.entries(AdminOrderStatus).map(
                (
                  [key, val] // Use AdminOrderStatus
                ) => (
                  <option key={val} value={val}>
                    {key.replace(/_/g, " ")} {/* Format enum key for display */}
                  </option>
                )
              )}
            </select>
            {/* Add SortBy dropdown if needed */}
            <select
              name="sortBy"
              className="form-select form-select-sm d-inline-block ms-2"
              style={{ width: "auto" }}
              value={filters.sortBy}
              onChange={handleFilterChange}
            >
              <option value="order_date_desc">Newest First (Order Date)</option>
              <option value="order_date_asc">Oldest First (Order Date)</option>
              <option value="package_price_desc">Price: High to Low</option>
              <option value="package_price_asc">Price: Low to High</option>
              {/* Add more sort options as needed */}
            </select>
          </div>
        </div>
      </div>
      <div className="card-body pt-0">
        {error && (
          <div className="alert alert-danger" role="alert">
            Error fetching orders: {error}
            <button
              onClick={refreshOrders}
              className="btn btn-sm btn-danger ms-2"
            >
              Retry
            </button>
          </div>
        )}

        <OrderTable
          orders={orders}
          isLoading={isLoading}
          refreshOrders={refreshOrders}
          onViewDetails={handleViewOrderDetails} // <-- PASS HANDLER TO TABLE
        />

        {!isLoading && totalOrders > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <span className="text-muted" style={{ fontSize: "0.875rem" }}>
              Showing {orders.length} of {totalOrders} orders. Page{" "}
              {currentPage} of {totalPages}.
            </span>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Previous
                  </button>
                </li>
                {/* Dynamic Page Numbers (Simplified) */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) =>
                    page === currentPage ||
                    Math.abs(page - currentPage) < 2 ||
                    page === 1 ||
                    page === totalPages ? (
                      <li
                        key={page}
                        className={`page-item ${
                          page === currentPage ? "active" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      </li>
                    ) : Math.abs(page - currentPage) === 2 &&
                      page !== 1 &&
                      page !== totalPages ? (
                      <li key={page} className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    ) : null
                )}
                <li
                  className={`page-item ${
                    currentPage === totalPages || totalPages === 0
                      ? "disabled"
                      : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
      <OrderDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        order={selectedOrder}
      />
    </div>
  );
};

export default OrderManagerWrapper;
