// src/components/management/DriverManagerWrapper.tsx
import React, { useState } from "react";
import type { IDriverFE } from "../../types";
import DriverTable from "./DriverTable"; // Import the new table component

// --- Dummy Driver Data ---
const dummyDrivers: IDriverFE[] = [
  {
    _id: "drv1",
    name: "Manish Kumar",
    phone: "9876501234",
    avatarUrl:
      "https://ui-avatars.com/api/?name=Manish+Kumar&size=40&background=random&color=fff&bold=true",
    vehicleType: "Bike",
    vehicleNumber: "GJ01MK5678",
    status: "Active",
    assignedZone: "West Ahmedabad",
    joinDate: "2024-08-10T00:00:00Z",
  },
  {
    _id: "drv2",
    name: "Sunita Devi",
    phone: "9123450987",
    avatarUrl:
      "https://ui-avatars.com/api/?name=Sunita+Devi&size=40&background=random&color=fff&bold=true",
    vehicleType: "Scooter",
    vehicleNumber: "GJ05SD1122",
    status: "On Delivery",
    assignedZone: "East Ahmedabad",
    joinDate: "2024-09-01T00:00:00Z",
  },
  {
    _id: "drv3",
    name: "Rajesh Patel",
    phone: "9988771122",
    avatarUrl:
      "https://ui-avatars.com/api/?name=Rajesh+Patel&size=40&background=random&color=fff&bold=true",
    vehicleType: "E-Bike",
    vehicleNumber: "GJ01RP3344",
    status: "Active",
    assignedZone: "South Ahmedabad",
    joinDate: "2024-11-15T00:00:00Z",
  },
  {
    _id: "drv4",
    name: "Anita Singh",
    phone: "9654321098",
    avatarUrl:
      "https://ui-avatars.com/api/?name=Anita+Singh&size=40&background=random&color=fff&bold=true",
    vehicleType: "Bike",
    vehicleNumber: "GJ03AS9900",
    status: "Inactive",
    joinDate: "2024-07-20T00:00:00Z",
  },
  {
    _id: "drv5",
    name: "Vijay Sharma",
    phone: "9001122334",
    avatarUrl:
      "https://ui-avatars.com/api/?name=Vijay+Sharma&size=40&background=random&color=fff&bold=true",
    vehicleType: "Scooter",
    vehicleNumber: "GJ01VS7788",
    status: "Active",
    assignedZone: "West Ahmedabad",
    joinDate: "2025-01-05T00:00:00Z",
  },
];

// --- The Wrapper Component ---
const DriverManagerWrapper: React.FC = () => {
  // Use static dummy data
  const [drivers] = useState<IDriverFE[]>(dummyDrivers);
  const [isLoading] = useState<boolean>(false); // Set true later if fetching

  return (
    <div className="card">
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col">
            <h4 className="card-title">Delivery Drivers</h4>
          </div>
          <div className="col-auto">
            {/* Placeholder for Add button */}
            <button
              className="btn btn-sm btn-primary"
              disabled={true} // Disable for now
            >
              <i className="fas fa-plus me-1"></i>
              Add Driver
            </button>
          </div>
        </div>
      </div>
      <div className="card-body pt-0">
        <DriverTable drivers={drivers} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default DriverManagerWrapper;
