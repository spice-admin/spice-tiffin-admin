// src/components/management/OrderManagerWrapper.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  DeliveryStatus,
  type IOrderAdminFE,
  type IOrderFilters,
  type IPaginationData,
  OrderStatus,
} from "../../types";
import { getAllOrdersAdminApi } from "../../services/order.service";
import OrderTable from "./OrderTable";
// Import pagination and filter components if you create them separately

const ITEMS_PER_PAGE = 10; // Default items per page

const OrderManagerWrapper: React.FC = () => {
  const [orders, setOrders] = useState<IOrderAdminFE[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- State for Pagination ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [limit, setLimit] = useState<number>(ITEMS_PER_PAGE);

  // --- State for Filters ---
  const [filters, setFilters] = useState<IOrderFilters>({
    status: "", // Default to all order statuses
    deliveryStatus: "", // Default to all delivery statuses
    search: "",
    sortBy: "createdAt_desc", // Default sort
  });

  const fetchOrders = useCallback(
    async (pageToFetch: number, currentFilters: IOrderFilters) => {
      setIsLoading(true);
      setError(null);
      try {
        console.log(
          `[OrderManagerWrapper] Fetching orders for page: ${pageToFetch}, filters:`,
          currentFilters
        );
        // Pass page, limit, and filters to the API service
        const result = await getAllOrdersAdminApi(
          pageToFetch,
          limit,
          currentFilters
        );

        // Correctly access nested data based on backend response structure
        if (
          result.success &&
          result.data &&
          result.data.orders &&
          result.data.pagination
        ) {
          console.log(
            "[OrderManagerWrapper] Orders fetched successfully:",
            result.data
          );
          setOrders(result.data.orders);
          // Update pagination state from API response
          setCurrentPage(result.data.pagination.currentPage);
          setTotalPages(result.data.pagination.totalPages);
          setTotalOrders(result.data.pagination.totalOrders);
          // limit is already in state, but you could update it if backend dictates it:
          // setLimit(result.data.pagination.limit);
        } else {
          throw new Error(
            result.message || "Failed to fetch orders or invalid data format."
          );
        }
      } catch (err) {
        console.error("[OrderManagerWrapper] Error fetching orders:", err);
        setError((err as Error).message);
        setOrders([]); // Clear orders on error
      } finally {
        setIsLoading(false);
        console.log("[OrderManagerWrapper] Finished fetching orders attempt.");
      }
    },
    [limit]
  ); // limit is a dependency for the service call

  useEffect(() => {
    fetchOrders(currentPage, filters);
  }, [fetchOrders, currentPage, filters]); // Re-fetch when page or filters change

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage); // This will trigger useEffect to re-fetch
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentPage(1); // Reset to page 1 on new search
    fetchOrders(1, filters); // Explicitly fetch, as filters object itself might not change reference if only sub-property changes
  };

  // TODO: Implement UI for pagination controls (buttons, page numbers)
  // TODO: Implement UI for filter controls (dropdowns for status, input for search)

  return (
    <div className="card">
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col">
            <h4 className="card-title">All Customer Orders</h4>
          </div>
          {/* Placeholder for filter controls */}
          <div className="col-auto">
            {/* Example Search */}
            <form onSubmit={handleSearchSubmit} className="d-inline-flex me-2">
              <input
                type="text"
                name="search"
                className="form-control form-control-sm"
                placeholder="Search Order#, Package..."
                value={filters.search}
                onChange={handleFilterChange}
              />
              <button type="submit" className="btn btn-sm btn-primary ms-1">
                Search
              </button>
            </form>
            {/* Example Status Filter */}
            <select
              name="status"
              className="form-select form-select-sm d-inline-block"
              style={{ width: "auto" }}
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Order Statuses</option>
              {Object.values(OrderStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              name="deliveryStatus"
              className="form-select form-select-sm d-inline-block ms-2"
              style={{ width: "auto" }}
              value={filters.deliveryStatus}
              onChange={handleFilterChange}
            >
              <option value="">All Delivery Statuses</option>
              {Object.values(DeliveryStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="card-body pt-0">
        {error && (
          <div className="alert alert-danger" role="alert">
            Error fetching orders: {error}
            <button
              onClick={() => fetchOrders(currentPage, filters)}
              className="btn btn-sm btn-danger ms-2"
            >
              Retry
            </button>
          </div>
        )}

        <OrderTable orders={orders} isLoading={isLoading} />

        {/* Basic Pagination Example */}
        {!isLoading && totalOrders > 0 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <span className="text-muted fs-sm">
              Showing {orders.length} of {totalOrders} orders
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
                {/* Simple page number display - can be enhanced */}
                <li className="page-item active" aria-current="page">
                  <span className="page-link">
                    {currentPage} / {totalPages}
                  </span>
                </li>
                <li
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
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
    </div>
  );
};

export default OrderManagerWrapper;
