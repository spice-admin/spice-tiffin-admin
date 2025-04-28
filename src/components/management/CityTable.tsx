// src/components/management/CityTable.tsx (Admin Panel)
import React from "react";
import type { ICityAdminFE } from "../../types";
// Import icons
import { HiOutlinePencilSquare, HiOutlineTrash } from "react-icons/hi2";

// Helper: Format Date
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString("en-CA", {
      // Canadian locale
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return "Invalid Date";
  }
};

// Props Interface
interface CityTableProps {
  cities: ICityAdminFE[];
  isLoading: boolean; // For overall loading state
  isActionLoading: boolean; // For disabling actions during add/edit/delete
  onEdit: (city: ICityAdminFE) => void; // Callback to open edit modal
  onDelete: (cityId: string, cityName: string) => void; // Callback to trigger delete
}

const CityTable: React.FC<CityTableProps> = ({
  cities,
  isLoading,
  isActionLoading,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover mb-0">
        {" "}
        {/* Bootstrap table classes */}
        <thead className="">
          {" "}
          {/* Use template header style */}
          <tr>
            <th>#</th>
            <th>City Name</th>
            <th>Created At</th>
            <th>Updated At</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={5} className="text-center py-4 text-muted">
                Loading cities...
              </td>
            </tr>
          )}
          {!isLoading && cities.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center py-4 text-muted">
                No cities found. Add one!
              </td>
            </tr>
          )}
          {!isLoading &&
            cities.map((city, index) => (
              <tr key={city._id}>
                <td>{index + 1}</td>
                <td className="fw-medium">{city.name}</td>
                <td className="fs-sm text-muted">
                  {formatDate(city.createdAt)}
                </td>
                <td className="fs-sm text-muted">
                  {formatDate(city.updatedAt)}
                </td>
                <td className="text-end">
                  <button
                    title="Edit City"
                    className="btn btn-sm btn-link p-0 me-2" // Bootstrap link button style
                    onClick={() => onEdit(city)}
                    disabled={isActionLoading}
                    style={{ color: "inherit" }}
                  >
                    <HiOutlinePencilSquare
                      size={18}
                      className="text-secondary"
                    />{" "}
                    {/* react-icon */}
                  </button>
                  <button
                    title="Delete City"
                    className="btn btn-sm btn-link p-0"
                    onClick={() => onDelete(city._id, city.name)}
                    disabled={isActionLoading}
                    style={{ color: "inherit" }}
                  >
                    <HiOutlineTrash size={18} className="text-danger" />{" "}
                    {/* react-icon */}
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default CityTable;
