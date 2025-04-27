// src/components/management/PaymentManagerWrapper.tsx
import React, { useState } from "react";
import type { IPaymentFE } from "../../types";
import PaymentTable from "./PaymentTable"; // Import the new table component

// --- Dummy Payment Data ---
const dummyPayments: IPaymentFE[] = [
  {
    _id: "pay1",
    customerName: "Aarav Sharma",
    customerEmail: "aarav.s@example.com",
    packageName: "Monthly Gujarati Thali",
    amount: 1499,
    paymentMethod: "UPI",
    status: "Completed",
    transactionId: "pi_3Phabc...",
    paymentDate: "2025-04-22T10:05:00Z",
  },
  {
    _id: "pay2",
    customerName: "Priya Patel",
    customerEmail: "priya.p@example.com",
    packageName: "Weekly Gujarati Thali",
    amount: 599,
    paymentMethod: "Stripe",
    status: "Completed",
    transactionId: "ch_3Pgxyz...",
    paymentDate: "2025-04-20T14:32:00Z",
  },
  {
    _id: "pay3",
    customerName: "Rohan Mehta",
    customerEmail: "rohan.m@example.com",
    packageName: "Monthly Punjabi Thali",
    amount: 1499,
    paymentMethod: "PayPal",
    status: "Pending",
    transactionId: undefined,
    paymentDate: "2025-04-23T09:15:00Z",
  },
  {
    _id: "pay4",
    customerName: "Sneha Reddy",
    customerEmail: "sneha.r@example.com",
    packageName: "Trial Gujarati Thali",
    amount: 199,
    paymentMethod: "Stripe",
    status: "Failed",
    transactionId: "ch_3Pfuvw...",
    paymentDate: "2025-04-19T11:03:00Z",
  },
  {
    _id: "pay5",
    customerName: "Vikram Singh",
    customerEmail: "vikram.s@example.com",
    packageName: "Monthly Punjabi Thali",
    amount: 1699,
    paymentMethod: "Bank Transfer",
    status: "Completed",
    transactionId: "txn_abc123",
    paymentDate: "2025-04-18T18:45:00Z",
  },
  {
    _id: "pay6",
    customerName: "Aarav Sharma",
    customerEmail: "aarav.s@example.com",
    packageName: "Trial Gujarati Thali",
    amount: 199,
    paymentMethod: "UPI",
    status: "Completed",
    transactionId: "pi_3Pdefg...",
    paymentDate: "2025-03-22T10:03:00Z",
  },
];

// --- The Wrapper Component ---
const PaymentManagerWrapper: React.FC = () => {
  // Use static dummy data for now
  const [payments] = useState<IPaymentFE[]>(dummyPayments);
  const [isLoading] = useState<boolean>(false); // Set true later if fetching

  return (
    <div className="card">
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col">
            <h4 className="card-title">Payment History</h4>
          </div>
          {/* No Add button typically needed for payment history view */}
          {/* <div className="col-auto"></div> */}
        </div>
      </div>
      <div className="card-body pt-0">
        <PaymentTable payments={payments} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default PaymentManagerWrapper;
