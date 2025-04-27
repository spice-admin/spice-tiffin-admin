// src/components/management/DriverTable.tsx
import React from "react";
import type { IDriverFE, DriverStatus } from "../../types";

// --- Avatar Component (Reuse or adapt from CustomerTable if needed) ---
const DriverAvatar = ({
  src,
  name,
  className,
}: {
  src?: string;
  name: string;
  className?: string;
}) => {
  const [imageError, setImageError] = React.useState(false);
  const defaultStyle: React.CSSProperties = {
    width: "40px",
    height: "40px",
    objectFit: "cover",
  };
  const fallbackInitial = name ? name.charAt(0).toUpperCase() : "?";

  const showImage = src && !imageError;

  const handleImageError = () => {
    console.warn(`Failed to load image: ${src}`);
    setImageError(true);
  };

  return (
    <>
      {showImage ? (
        <img
          src={src}
          alt={`${name}'s avatar`}
          className={`rounded-circle ${className || ""}`}
          style={defaultStyle}
          onError={handleImageError}
          loading="lazy"
        />
      ) : (
        <div
          className={`d-flex align-items-center justify-content-center bg-info text-white rounded-circle fw-bold ${
            className || ""
          }`} // Different color maybe
          style={defaultStyle}
          title={name}
        >
          {fallbackInitial}
        </div>
      )}
    </>
  );
};

// --- Helper: Format Date ---
const formatDateOnly = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

// --- Status Badge Component ---
const DriverStatusBadge = ({ status }: { status: DriverStatus }) => {
  let badgeClass = "badge bg-secondary-subtle text-secondary"; // Default: Inactive
  let iconClass = "fas fa-times-circle me-1"; // Default: Inactive icon

  switch (status) {
    case "Active":
      badgeClass = "badge bg-success-subtle text-success";
      iconClass = "fas fa-check-circle me-1";
      break;
    case "On Delivery":
      badgeClass = "badge bg-primary-subtle text-primary";
      iconClass = "fas fa-truck me-1";
      break;
    case "Inactive":
      // Default already set
      break;
  }

  return (
    <span className={badgeClass}>
      <i className={iconClass}></i> {status}
    </span>
  );
};

// --- Props Interface ---
interface DriverTableProps {
  drivers: IDriverFE[];
  isLoading: boolean;
}

// --- The Table Component ---
const DriverTable: React.FC<DriverTableProps> = ({ drivers, isLoading }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover mb-0">
        <thead className="">
          <tr>
            <th>Driver</th>
            <th>Contact</th>
            <th>Vehicle</th>
            <th>Zone</th>
            <th>Status</th>
            <th>Joined Date</th>
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
                No drivers found.
              </td>
            </tr>
          )}
          {!isLoading &&
            drivers.map((driver) => (
              <tr key={driver._id} style={{ verticalAlign: "middle" }}>
                {/* Driver Column (Avatar + Name) */}
                <td>
                  <div className="d-flex align-items-center">
                    <DriverAvatar
                      src={driver.avatarUrl}
                      name={driver.name}
                      className="me-2"
                    />
                    <span className="fw-medium">{driver.name}</span>
                  </div>
                </td>
                {/* Contact Column */}
                <td>{driver.phone}</td>
                {/* Vehicle Column */}
                <td>
                  <div>{driver.vehicleType}</div>
                  <div className="text-muted fs-sm">{driver.vehicleNumber}</div>
                </td>
                {/* Zone Column */}
                <td>
                  {driver.assignedZone || (
                    <span className="text-muted">N/A</span>
                  )}
                </td>
                {/* Status Column */}
                <td>
                  <DriverStatusBadge status={driver.status} />
                </td>
                {/* Joined Date Column */}
                <td>{formatDateOnly(driver.joinDate)}</td>
                {/* Action Buttons (Placeholders) */}
                <td className="text-end">
                  <button
                    title="Edit Driver"
                    className="btn btn-sm btn-link p-0 me-2"
                    disabled={true}
                    style={{ color: "inherit" }}
                  >
                    <i className="las la-pen text-secondary fs-18"></i>
                  </button>
                  <button
                    title="View Details"
                    className="btn btn-sm btn-link p-0"
                    disabled={true}
                    style={{ color: "inherit" }}
                  >
                    <i className="las la-eye text-secondary fs-18"></i>
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
