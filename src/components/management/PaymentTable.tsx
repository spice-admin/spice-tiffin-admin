// src/components/management/PaymentTable.tsx
import React from "react";
import type { IPaymentFE } from "../../types"; // Import the payment type

// --- Helper: Format Date ---
const formatDate = (dateString: string): string => {
  try {
    // Using Indian locale and adding time
    return new Date(dateString).toLocaleString("en-IN", {
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

// --- Helper: Format Currency ---
const formatCurrency = (amount: number): string => {
  // Assuming INR for India, adjust currency code and locale as needed
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

// --- Status Badge Component ---
const PaymentStatusBadge = ({ status }: { status: IPaymentFE["status"] }) => {
  let badgeClass = "badge bg-warning-subtle text-warning"; // Default: Pending
  let iconClass = "fas fa-clock me-1"; // Default: Pending icon

  switch (status) {
    case "Completed":
      badgeClass = "badge bg-success-subtle text-success";
      iconClass = "fas fa-check-circle me-1"; // Changed icon
      break;
    case "Failed":
      badgeClass = "badge bg-danger-subtle text-danger";
      iconClass = "fas fa-times-circle me-1"; // Changed icon
      break;
    // Add 'Pending' explicitly if needed, otherwise default handles it
    // case 'Pending':
    // badgeClass = 'badge bg-warning-subtle text-warning';
    // iconClass = 'fas fa-clock me-1';
    // break;
  }

  return (
    <span className={badgeClass}>
      <i className={iconClass}></i> {status}
    </span>
  );
};

// --- Props Interface ---
interface PaymentTableProps {
  payments: IPaymentFE[];
  isLoading: boolean;
}

// --- The Table Component ---
const PaymentTable: React.FC<PaymentTableProps> = ({ payments, isLoading }) => {
  return (
    <div className="table-responsive">
      <table className="table table-hover mb-0">
        <thead className="">
          <tr>
            <th>Transaction ID</th>
            <th>Customer</th>
            <th>Package</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th>Date</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={8} className="text-center py-4 text-muted">
                Loading payments...
              </td>
            </tr>
          )}
          {!isLoading && payments.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center py-4 text-muted">
                No payments found.
              </td>
            </tr>
          )}
          {!isLoading &&
            payments.map((payment) => (
              <tr key={payment._id} style={{ verticalAlign: "middle" }}>
                {/* Transaction ID */}
                <td className="font-monospace text-muted fs-sm">
                  {payment.transactionId || "N/A"}
                </td>
                {/* Customer */}
                <td>
                  <div>{payment.customerName}</div>
                  <div className="text-muted fs-sm">
                    {payment.customerEmail}
                  </div>
                </td>
                {/* Package */}
                <td>{payment.packageName}</td>
                {/* Amount */}
                <td className="fw-medium">{formatCurrency(payment.amount)}</td>
                {/* Method */}
                <td>{payment.paymentMethod}</td>
                {/* Status */}
                <td>
                  <PaymentStatusBadge status={payment.status} />
                </td>
                {/* Date */}
                <td>{formatDate(payment.paymentDate)}</td>
                {/* Action Buttons (Placeholders) */}
                <td className="text-end">
                  <button
                    title="View Details"
                    className="btn btn-sm btn-link p-0"
                    disabled={true} // Disable for now
                    style={{ color: "inherit" }}
                  >
                    {/* Example icon, replace if needed */}
                    <i className="las la-eye text-secondary fs-18"></i>
                  </button>
                  {/* Add other actions like 'Refund' later if needed */}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentTable;
