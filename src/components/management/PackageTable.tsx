// src/components/management/PackageTable.tsx
import React from "react";
import type { IPackageFE } from "../../types";
import PackageImage from "./PackageImage"; // Import the new component

// --- Props Interface ---
interface PackageTableProps {
  packages: IPackageFE[];
  isLoading: boolean;
  isActionLoading: boolean;
  onEdit: (pkg: IPackageFE) => void;
  onDelete: (id: string) => void;
}

// --- Helper: Format Date --- (Keep this function)
const formatDate = (dateString: string): string => {
  // ... (implementation from previous step) ...
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

const PackageTable: React.FC<PackageTableProps> = ({
  packages,
  isLoading,
  isActionLoading,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="table-responsive">
      <table className="table mb-0">
        <thead className="">
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Category</th>
            <th>Type</th>
            <th>Days</th>
            <th>Price</th>
            <th>Created</th>
            <th className="text-end">Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={8} className="text-center py-4 text-muted">
                Loading packages...
              </td>
            </tr>
          )}
          {!isLoading && packages.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center py-4 text-muted">
                No packages found. Add one!
              </td>
            </tr>
          )}
          {!isLoading &&
            packages.map((pkg) => (
              <tr key={pkg._id} style={{ verticalAlign: "middle" }}>
                {/* Use the PackageImage component */}
                <td>
                  <PackageImage
                    src={pkg.image}
                    alt={pkg.name}
                    className="rounded-circle" // Pass Bootstrap class
                  />
                </td>
                {/* Name / Description Column */}
                <td>
                  <p className="d-inline-block align-middle mb-0">
                    <span className="d-block align-middle mb-0 product-name text-body">
                      {pkg.name}
                    </span>
                    {pkg.description && (
                      <span className="text-muted font-13">
                        {pkg.description}
                      </span>
                    )}
                  </p>
                </td>
                <td>
                  {pkg.category?.name || (
                    <span className="text-muted">N/A</span>
                  )}
                </td>
                <td className="text-capitalize">{pkg.type}</td>
                <td>{pkg.days}</td>
                <td>${pkg.price.toFixed(2)}</td>
                <td>{formatDate(pkg.createdAt)}</td>
                {/* Action Buttons */}
                <td className="text-end">
                  <button
                    title="Edit Package"
                    className="btn btn-sm btn-link p-0 me-2"
                    onClick={() => onEdit(pkg)}
                    disabled={isActionLoading}
                    style={{ color: "inherit" }}
                  >
                    <i className="las la-pen text-secondary fs-18"></i>
                  </button>
                  <button
                    title="Delete Package"
                    className="btn btn-sm btn-link p-0"
                    onClick={() => onDelete(pkg._id)}
                    disabled={isActionLoading}
                    style={{ color: "inherit" }}
                  >
                    <i className="las la-trash-alt text-secondary fs-18"></i>
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default PackageTable;
