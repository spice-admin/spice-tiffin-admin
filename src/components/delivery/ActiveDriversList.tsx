// src/components/delivery/ActiveDriversList.tsx

import React from "react";
import type { IDriverFE } from "../../types"; // Adjust path

interface ActiveDriversListProps {
  drivers: IDriverFE[];
  selectedDriverId: string | null;
  onSelect: (driverId: string | null) => void; // Callback when a driver is selected
  isLoading: boolean;
}

const ActiveDriversList: React.FC<ActiveDriversListProps> = ({
  drivers,
  selectedDriverId,
  onSelect,
  isLoading,
}) => {
  return (
    <div
      className="list-group overflow-auto"
      style={{ maxHeight: "400px" }} // Make list scrollable
    >
      {isLoading && (
        <div className="list-group-item text-center text-muted">
          Loading drivers...
        </div>
      )}
      {!isLoading && drivers.length === 0 && (
        <div className="list-group-item text-center text-muted">
          No active drivers found.
        </div>
      )}
      {!isLoading &&
        drivers.map((driver) => (
          <button // Use button for clickable items
            type="button"
            key={driver._id}
            className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
              selectedDriverId === driver._id ? "active" : "" // Highlight selected driver
            }`}
            onClick={() => onSelect(driver._id)} // Call onSelect prop
            disabled={isLoading} // Disable during parent loading state
            aria-pressed={selectedDriverId === driver._id} // Accessibility state
          >
            <div>
              <h6 className="mb-0">{driver.fullName}</h6>
              <small className="text-muted">{driver.phone}</small>
            </div>
            {/* Optional: Add vehicle number or other info */}
            {/* <span className="badge bg-light text-dark">{driver.vehicleNumber}</span> */}

            {/* Indicate selection */}
            {selectedDriverId === driver._id && (
              <i className="fas fa-check-circle text-white ms-2"></i> // Example checkmark
            )}
          </button>
        ))}
    </div>
  );
};

export default ActiveDriversList;
