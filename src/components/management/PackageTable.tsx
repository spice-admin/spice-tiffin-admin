import React from "react";
import type { Package } from "../../types"; // Adjust path
import PackageImage from "./PackageImage"; // Adjust path
import { HiOutlinePencilSquare, HiOutlineTrash } from "react-icons/hi2"; // Example icons

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-CA", {
      // Using en-CA for YYYY-MM-DD like format
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

interface PackageTableProps {
  packages: Package[];
  isLoading: boolean;
  isActionLoading: boolean;
  onEdit: (pkg: Package) => void;
  onDelete: (id: string, name: string) => void; // Added name for confirm dialog
}

const PackageTable: React.FC<PackageTableProps> = ({
  packages,
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
            <th>Image</th>
            <th>Name</th>
            <th>Category</th>
            <th>Type</th>
            <th>Days</th>
            <th>Price</th>
            <th>Active</th>
            <th>Created</th>
            <th className="text-end">Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={9} className="text-center py-4 text-muted">
                Loading packages...
              </td>
            </tr>
          )}
          {!isLoading && packages.length === 0 && (
            <tr>
              <td colSpan={9} className="text-center py-4 text-muted">
                No packages found. Add one!
              </td>
            </tr>
          )}
          {!isLoading &&
            packages.map((pkg) => (
              <tr key={pkg.id} style={{ verticalAlign: "middle" }}>
                <td>
                  <PackageImage
                    src={pkg.image_url}
                    alt={pkg.name}
                    className="rounded"
                  />{" "}
                  {/* Example: rounded class */}
                </td>
                <td>
                  <p className="d-inline-block align-middle mb-0">
                    <span className="d-block align-middle mb-0 product-name text-body">
                      {pkg.name}
                    </span>
                    {pkg.description && (
                      <span className="text-muted font-13 d-block">
                        {pkg.description}
                      </span>
                    )}
                  </p>
                </td>
                <td>
                  {pkg.categories?.name || (
                    <span className="text-muted">N/A</span>
                  )}
                </td>
                <td className="text-capitalize">{pkg.type}</td>
                <td>{pkg.days}</td>
                <td>${pkg.price.toFixed(2)}</td>
                <td>
                  <span
                    className={`badge bg-${
                      pkg.is_active ? "success" : "danger"
                    }-subtle text-${
                      pkg.is_active ? "success" : "danger"
                    } border border-${pkg.is_active ? "success" : "danger"}`}
                  >
                    {pkg.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{formatDate(pkg.created_at)}</td>
                <td className="text-end">
                  <button
                    title="Edit Package"
                    className="btn btn-sm btn-link p-0 me-2"
                    onClick={() => onEdit(pkg)}
                    disabled={isActionLoading}
                    style={{ color: "inherit" }}
                  >
                    <HiOutlinePencilSquare
                      size={18}
                      className="text-secondary"
                    />
                  </button>
                  <button
                    title="Delete Package"
                    className="btn btn-sm btn-link p-0"
                    onClick={() => onDelete(pkg.id, pkg.name)}
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

export default PackageTable;
