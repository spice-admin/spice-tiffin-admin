// src/components/delivery/AssignmentPanel.tsx

import React, { useState, useCallback } from "react";
import type { IOrderAdminFE, IDriverFE } from "../../types"; // Adjust path
import AssignableOrdersList from "./AssignableOrdersList"; // Adjust path
import ActiveDriversList from "./ActiveDriversList"; // Adjust path

interface AssignmentPanelProps {
  pendingOrders: IOrderAdminFE[];
  activeDrivers: IDriverFE[];
  selectedDriverId: string | null;
  onDriverSelect: (driverId: string | null) => void; // Callback to update selected driver in parent
  onAssign: (driverId: string, orderIds: string[]) => Promise<void>; // Async callback to trigger assignment
  isLoading: boolean; // Combined loading state for orders/drivers/assignment action
}

const AssignmentPanel: React.FC<AssignmentPanelProps> = ({
  pendingOrders,
  activeDrivers,
  selectedDriverId,
  onDriverSelect,
  onAssign,
  isLoading, // Use this prop to disable elements during loading
}) => {
  // State to track which orders are selected in the AssignableOrdersList
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(
    new Set()
  );

  // Callback for AssignableOrdersList to update selected order IDs
  const handleOrderSelectionChange = useCallback(
    (newSelectedIds: Set<string>) => {
      setSelectedOrderIds(newSelectedIds);
    },
    []
  );

  // Handler for the main Assign button
  const handleAssignClick = async () => {
    if (!selectedDriverId || selectedOrderIds.size === 0) {
      // Basic validation, parent wrapper might show notification
      console.warn("Driver or orders not selected for assignment.");
      return;
    }
    try {
      // Call the onAssign prop passed from the parent wrapper
      await onAssign(selectedDriverId, Array.from(selectedOrderIds));
      // Clear local selection on successful assignment initiation
      setSelectedOrderIds(new Set());
      // Parent wrapper will handle notifications and potential data refetching
    } catch (error) {
      // Parent wrapper likely shows notification, but log here too
      console.error("Assignment failed:", error);
    }
  };

  return (
    <div className="card">
      {" "}
      {/* Use card structure */}
      <div className="card-header">
        <h5 className="card-title mb-0">Assign Orders</h5>
      </div>
      <div className="card-body">
        <div className="row g-3">
          {/* Column for Assignable Orders */}
          <div className="col-md-6">
            <h6>1. Select Orders (Pending Assignment)</h6>
            <AssignableOrdersList
              orders={pendingOrders}
              selectedOrderIds={selectedOrderIds}
              onSelectionChange={handleOrderSelectionChange}
              isLoading={isLoading} // Pass loading state
            />
          </div>

          {/* Column for Active Drivers */}
          <div className="col-md-6">
            <h6>2. Select Driver (Active)</h6>
            <ActiveDriversList
              drivers={activeDrivers}
              selectedDriverId={selectedDriverId}
              onSelect={onDriverSelect} // Pass callback from parent
              isLoading={isLoading} // Pass loading state
            />
          </div>
        </div>

        {/* Assignment Action Button */}
        <div className="mt-4 text-center">
          {" "}
          {/* Add spacing and center */}
          <button
            className="btn btn-primary"
            onClick={handleAssignClick}
            disabled={
              isLoading || // Disable if any loading is happening
              !selectedDriverId || // Disable if no driver selected
              selectedOrderIds.size === 0 // Disable if no orders selected
            }
          >
            {/* Show loading state if assignment is in progress */}
            {isLoading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Assigning...
              </>
            ) : (
              `Assign ${selectedOrderIds.size} Order(s) to Selected Driver`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignmentPanel;
