// src/components/management/DriverTable.tsx

import React from "react";
import type { IDriverFE } from "../../types"; // Adjust path

interface DriverTableProps {
  drivers: IDriverFE[];
  isLoading: boolean; // Loading state for initial fetch/empty table
  isActionLoading: boolean; // Loading state for disabling actions during operations
  onEdit: (driver: IDriverFE) => void;
  onDelete: (id: string) => void;
}

// Helper to format Date
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

const DriverTable: React.FC<DriverTableProps> = ({
  drivers,
  isLoading,
  isActionLoading,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="table-responsive">
      <table className="table mb-0 table-striped table-hover">
        {/* Added table-hover */}
        <thead className="">
          <tr>
            {/* Adjust columns as needed */}
            <th>Full Name</th>
            <th>Phone</th>
            <th>Vehicle No</th>
            <th>Status</th>
            <th>Registered On</th>
            <th className="text-end">Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={6} className="text-center py-4 text-muted">
                {/* Updated colSpan */}
                Loading drivers...
              </td>
            </tr>
          )}
          {!isLoading && drivers.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-4 text-muted">
                {/* Updated colSpan */}
                No drivers found. Add one!
              </td>
            </tr>
          )}
          {!isLoading &&
            drivers.map((driver) => (
              <tr key={driver._id} style={{ verticalAlign: "middle" }}>
                <td>{driver.fullName}</td>
                <td>{driver.phone}</td>
                <td>{driver.vehicleNumber}</td>
                <td>
                  <span
                    className={`badge ${
                      driver.status === "Active"
                        ? "bg-success-light text-success"
                        : "bg-danger-light text-danger"
                    }`}
                  >
                    {driver.status}
                  </span>
                </td>
                <td>{formatDate(driver.createdAt)}</td>
                <td className="text-end">
                  <button
                    title="Edit Driver"
                    className="btn btn-sm btn-link p-0 me-2" // Using link style for icons
                    onClick={() => onEdit(driver)}
                    disabled={isActionLoading}
                    style={{ color: "inherit" }} // Use default text color
                  >
                    <i className="las la-pen text-secondary fs-18"></i>
                    {/* Line Awesome icon */}
                  </button>
                  <button
                    title="Delete Driver"
                    className="btn btn-sm btn-link p-0"
                    onClick={() => onDelete(driver._id)}
                    disabled={isActionLoading}
                    style={{ color: "inherit" }}
                  >
                    <i className="las la-trash-alt text-secondary fs-18"></i>
                    {/* Line Awesome icon */}
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default DriverTable;
