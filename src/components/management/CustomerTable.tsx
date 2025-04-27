// src/components/management/CustomerTable.tsx (Admin Panel)
import React from "react";
// Use the Admin-specific customer type
import type { ICustomerAdminFE } from "../../types";
// Import icons if needed
import { HiCheckCircle, HiXCircle } from "react-icons/hi2";

// --- Avatar Component (Keep existing or adapt) ---
const CustomerAvatar = ({
  src,
  name,
  className,
}: {
  src?: string;
  name: string;
  className?: string;
}) => {
  /* ... */
};

// --- Helper: Format Date ---
const formatDateOnly = (dateString: string): string => {
  /* ... */
};

// --- Verification Badge ---
const VerificationBadge = ({ verified }: { verified: boolean }) => {
  return verified ? (
    <span className="badge bg-success-subtle text-success d-inline-flex align-items-center">
      <HiCheckCircle className="me-1" size={14} /> Verified
    </span>
  ) : (
    <span className="badge bg-warning-subtle text-warning d-inline-flex align-items-center">
      <HiXCircle className="me-1" size={14} /> Not Verified
    </span>
  );
};

// --- Props Interface ---
interface CustomerTableProps {
  customers: ICustomerAdminFE[]; // Use Admin Customer type
  isLoading: boolean;
  // TODO: Add handlers for admin actions
}

// --- The Table Component ---
const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  isLoading,
}) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover mb-0">
        <thead className="">
          <tr>
            <th>Customer</th>
            <th>Contact</th>
            <th>Verification</th> {/* Added Verification Status */}
            <th>Address</th> {/* Added Address Summary */}
            <th>Joined Date</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={6} className="text-center py-4 text-muted">
                Loading customers...
              </td>
            </tr>
          )}
          {!isLoading && customers.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-4 text-muted">
                No customers found.
              </td>
            </tr>
          )}
          {!isLoading &&
            customers.map((customer) => (
              <tr key={customer._id} style={{ verticalAlign: "middle" }}>
                {/* Customer Column */}
                <td>
                  <div className="d-flex align-items-center">
                    {/* <CustomerAvatar src={customer.avatarUrl} name={customer.fullName} className="me-2" /> */}
                    <span className="fw-medium">{customer.fullName}</span>
                  </div>
                </td>
                {/* Contact Column */}
                <td>
                  <div>{customer.email}</div>
                  <div className="text-muted fs-sm">{customer.mobile}</div>
                </td>
                {/* Verification Status Column */}
                <td>
                  <VerificationBadge verified={customer.verification} />
                </td>
                {/* Address Summary Column */}
                <td className="fs-sm text-muted">
                  {customer.address || customer.city || customer.postalCode
                    ? `${
                        customer.address
                          ? customer.address.substring(0, 25) + "..."
                          : ""
                      } ${customer.city || ""} ${
                        customer.postalCode || ""
                      }`.trim()
                    : "-"}
                </td>
                {/* Joined Date Column */}
                <td>{formatDateOnly(customer.createdAt)}</td>
                {/* Action Buttons (Placeholders) */}
                <td className="text-end">
                  <button
                    title="View Details"
                    className="btn btn-sm btn-link p-0 me-2"
                    disabled={true}
                    style={{ color: "inherit" }}
                  >
                    <i className="las la-eye text-secondary fs-18"></i>
                  </button>
                  <button
                    title="Edit Customer"
                    className="btn btn-sm btn-link p-0"
                    disabled={true}
                    style={{ color: "inherit" }}
                  >
                    <i className="las la-pen text-secondary fs-18"></i>
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;
