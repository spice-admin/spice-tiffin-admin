// src/components/management/CityTable.tsx
import React from "react";
// Assuming City type is imported from a shared location or defined here based on Supabase
import type { City } from "../../types";
import { HiOutlinePencilSquare, HiOutlineTrash } from "react-icons/hi2";

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleString("en-CA", {
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

interface CityTableProps {
  cities: City[];
  isLoading: boolean;
  isActionLoading: boolean;
  onEdit: (city: City) => void;
  onDelete: (cityId: string, cityName: string) => void;
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
        <thead>
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
              <tr key={city.id}>
                {" "}
                {/* Use city.id */}
                <td>{index + 1}</td>
                <td className="fw-medium">{city.name}</td>
                <td className="fs-sm text-muted">
                  {formatDate(city.created_at)}
                </td>
                <td className="fs-sm text-muted">
                  {formatDate(city.updated_at)}
                </td>
                <td className="text-end">
                  <button
                    title="Edit City"
                    className="btn btn-sm btn-link p-0 me-2"
                    onClick={() => onEdit(city)}
                    disabled={isActionLoading}
                    style={{ color: "inherit" }}
                  >
                    <HiOutlinePencilSquare
                      size={18}
                      className="text-secondary"
                    />
                  </button>
                  <button
                    title="Delete City"
                    className="btn btn-sm btn-link p-0"
                    onClick={() => onDelete(city.id, city.name)}
                    disabled={isActionLoading}
                    style={{ color: "inherit" }}
                  >
                    <HiOutlineTrash size={18} className="text-danger" />
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
