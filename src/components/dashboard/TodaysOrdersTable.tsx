// src/components/dashboard/TodaysOrdersTable.tsx

import React, { useState, useEffect } from "react";
import { getActiveOrdersForAdmin } from "../../services/admin.service"; // Adjust path
import type { IAdminOrderFE } from "../../types"; // Adjust path

const TodaysOrdersTable: React.FC = () => {
  const [orders, setOrders] = useState<IAdminOrderFE[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      const response = await getActiveOrdersForAdmin();
      if (response.success) {
        setOrders(response.data);
      } else {
        setError(response.message || "Failed to load active orders.");
      }
      setIsLoading(false);
    };

    fetchOrders();
  }, []);

  // Helper function to format dates
  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    try {
      // Use options for better readability
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return "Invalid Date";
    }
  };

  // Helper function to format address
  const formatAddress = (
    addressObj: IAdminOrderFE["deliveryAddress"] | undefined
  ): string => {
    if (!addressObj) return "N/A";
    const parts = [
      addressObj.address,
      addressObj.city,
      addressObj.postalCode,
    ].filter(Boolean); // Filter out empty/null parts
    return parts.join(", ") || "N/A";
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12">
        <div className="card">
          <div className="card-header">
            <div className="row align-items-center">
              <div className="col">
                {/* --- Updated Title --- */}
                <h4 className="card-title">Today's Active Orders</h4>
              </div>
              {/* Optional: Keep or remove the dropdown filter as needed */}
              {/* <div className="col-auto"> ... dropdown ... </div> */}
            </div>
          </div>
          <div className="card-body pt-0">
            {isLoading && (
              <div className="text-center p-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            )}
            {error && (
              <div className="alert alert-danger text-center" role="alert">
                {error}
              </div>
            )}
            {!isLoading && !error && orders.length === 0 && (
              <div className="text-center p-4">No active orders found.</div>
            )}
            {!isLoading && !error && orders.length > 0 && (
              <div className="table-responsive">
                <table className="table mb-0 table-striped">
                  <thead>
                    {" "}
                    {/* --- Updated Headers --- */}
                    <tr>
                      <th className="border-top-0">Order #</th>
                      <th className="border-top-0">Customer</th>
                      <th className="border-top-0">Contact</th>
                      <th className="border-top-0">Package</th>
                      <th className="border-top-0">End Date</th>

                      <th className="border-top-0">Status</th>
                      <th className="border-top-0 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td>
                          {/* --- Order Number --- */}
                          <span className="text-primary fw-semibold">
                            {order.orderNumber || "N/A"}
                          </span>
                        </td>
                        <td>
                          {/* --- Customer Name --- */}
                          <div className="d-flex align-items-center">
                            {/* Optional: Add customer avatar/icon */}
                            {/* <img src="..." height="34" className="me-3 ..." /> */}
                            <div className="flex-grow-1 text-truncate">
                              <h6 className="m-0 mb-n1 fs-13">
                                {order.customer?.fullName || "N/A"}
                              </h6>
                              {/* Optional: Link to customer details */}
                              {/* <a href="#" className="fs-11 text-primary">ID: {order.customer?._id}</a> */}
                            </div>
                          </div>
                        </td>
                        <td>
                          {/* --- Customer Contact --- */}
                          <div className="text-truncate fs-12">
                            {order.customer?.email && (
                              <div>
                                <i className="iconoir-mail me-1"></i>
                                {order.customer.email}
                              </div>
                            )}
                            {order.customer?.phone && (
                              <div>
                                <i className="iconoir-phone me-1"></i>
                                {order.customer.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          {/* --- Package Name & Type --- */}
                          {order.package?.name || "N/A"}
                          {order.package?.type && (
                            <small className="text-muted d-block">
                              ({order.package.type})
                            </small>
                          )}
                        </td>
                        <td>
                          {/* --- End Date --- */}
                          {formatDate(order.endDate)}
                        </td>

                        <td>
                          {/* --- Status Badge --- */}
                          <span
                            className={`badge border px-2 ${
                              order.status === "Active"
                                ? "text-success border-success"
                                : "text-muted border-muted"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="text-end">
                          {/* --- Actions (Placeholders) --- */}
                          <a
                            href="#" // TODO: Link to order details page
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="View Details"
                            className="me-1"
                          >
                            <i className="iconoir-eye-alt text-secondary fs-18"></i>
                          </a>
                          {/* Add other relevant actions if needed */}
                          {/* <a href="#" title="Edit"><i className="iconoir-edit text-secondary fs-18"></i></a> */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodaysOrdersTable;
