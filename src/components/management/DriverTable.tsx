// src/components/management/DriverTable.tsx
import React from "react";
import { HiOutlinePencil, HiOutlineTrash } from "react-icons/hi2"; // Using react-icons

// --- Component-Specific Interface ---
// (Copied from DriverManagerWrapper - for props)
export interface Driver {
  id: string; // Corresponds to auth.users.id and drivers.id
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  vehicleNumber?: string | null;
  isActive: boolean;
  createdAt?: string; // Registration date from auth.users
}
// --- End Interface ---

interface DriverTableProps {
  drivers: Driver[];
  isLoading: boolean;
  isActionLoading: boolean; // To disable action buttons during any operation
  onEdit: (driver: Driver) => void;
  onDelete: (id: string) => void;
}

const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-CA", {
      // Using en-CA for consistency
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
      <table className="table table-sm table-hover mb-0">
        {" "}
        {/* Added table-sm */}
        <thead className="table-light">
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Vehicle No</th>
            <th>Status</th>
            <th>Registered On</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={7} className="text-center py-4 text-muted">
                Loading drivers...
              </td>
            </tr>
          )}
          {!isLoading && drivers.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-4 text-muted">
                No drivers found. Click "Add Driver" to create one.
              </td>
            </tr>
          )}
          {!isLoading &&
            drivers.map((driver) => (
              <tr key={driver.id} style={{ verticalAlign: "middle" }}>
                <td>{driver.fullName || "N/A"}</td>
                <td>{driver.email || "N/A"}</td>
                <td>{driver.phone || "N/A"}</td>
                <td>{driver.vehicleNumber || "N/A"}</td>
                <td>
                  <span
                    className={`badge px-2 py-1 rounded-pill ${
                      driver.isActive
                        ? "bg-success-subtle text-success"
                        : "bg-danger-subtle text-danger"
                    }`}
                  >
                    {driver.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  {driver.createdAt ? formatDate(driver.createdAt) : "N/A"}
                </td>
                <td className="text-end">
                  <button
                    title="Edit Driver"
                    className="btn btn-sm btn-outline-secondary p-1 me-2"
                    onClick={() => onEdit(driver)}
                    disabled={isActionLoading}
                  >
                    <HiOutlinePencil size={16} />
                  </button>
                  <button
                    title="Delete Driver"
                    className="btn btn-sm btn-outline-danger p-1"
                    onClick={() => onDelete(driver.id)}
                    disabled={isActionLoading}
                  >
                    <HiOutlineTrash size={16} />
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
