// src/components/management/DeliveryManagerWrapper.tsx

import React, { useState, useEffect, useCallback } from "react";

// Import necessary types (Adjust paths as needed)
import type { IOrderAdminFE, IDriverFE } from "../../types";

// Import service functions (Adjust paths as needed)
// Assuming you have these functions defined in your admin service file(s)
import {
  getAssignableOrdersAdminApi,
  getActiveDriversAdminApi,
  getAssignedOrdersForDriverApi,
  assignOrdersToDriverApi,
  optimizeRouteApi,
} from "../../services/admin.service";
// Import assignment/route services later when needed

// Import Child Components (Create these files later)
import AssignmentPanel from "../delivery/AssignmentPanel";
import DeliveryMapView from "../delivery/DeliveryMapView";
import RouteControls from "../delivery/RouteControls";

const DeliveryManagerWrapper: React.FC = () => {
  // --- State ---
  const [assignableOrders, setAssignableOrders] = useState<IOrderAdminFE[]>([]);
  const [activeDrivers, setActiveDrivers] = useState<IDriverFE[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  // *** Corrected State Variable Name Usage ***
  const [assignedOrders, setAssignedOrders] = useState<IOrderAdminFE[]>([]); // Use 'assignedOrders' consistently
  const [isAssignedOrdersLoading, setIsAssignedOrdersLoading] =
    useState<boolean>(false);
  const [assignmentPanelIsLoading, setAssignmentPanelIsLoading] =
    useState(false);

  // *** End Correction ***
  const [isAssignableLoading, setIsAssignableLoading] = useState<boolean>(true);
  const [isDriversLoading, setIsDriversLoading] = useState<boolean>(true);
  const [isAssignmentLoading, setIsAssignmentLoading] =
    useState<boolean>(false);
  const [isRouteLoading, setIsRouteLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // --- Data Fetching ---
  const fetchAssignableOrders = useCallback(async () => {
    setIsAssignableLoading(true);
    setError(null); // Clear previous errors specific to this fetch
    try {
      // Replace with your actual service call
      console.log("[Wrapper] Fetching assignable orders...");
      const response = await getAssignableOrdersAdminApi(); // Assumes this function exists and returns ApiResponse<IOrderAdminFE[]>
      if (response.success && Array.isArray(response.data)) {
        setAssignableOrders(response.data);
        console.log(
          `[Wrapper] Found ${response.data.length} assignable orders.`
        );
      } else {
        throw new Error(
          response.message || "Failed to fetch assignable orders"
        );
      }
    } catch (err: any) {
      const message = err.message || "Error loading pending orders.";
      console.error("[Wrapper] Fetch Assignable Orders Error:", message);
      setError(message); // Set general error state
      showNotification("error", message);
      setAssignableOrders([]); // Ensure it's an empty array on error
    } finally {
      setIsAssignableLoading(false);
    }
  }, []);

  const fetchActiveDrivers = useCallback(async () => {
    setIsDriversLoading(true);
    setError(null); // Clear previous errors specific to this fetch
    try {
      // Replace with your actual service call
      console.log("[Wrapper] Fetching active drivers...");
      const response = await getActiveDriversAdminApi(); // Assumes this function exists and returns ApiResponse<IDriverFE[]>
      if (response.success && Array.isArray(response.data)) {
        setActiveDrivers(response.data);
        console.log(`[Wrapper] Found ${response.data.length} active drivers.`);
      } else {
        throw new Error(response.message || "Failed to fetch active drivers");
      }
    } catch (err: any) {
      const message = err.message || "Error loading active drivers.";
      console.error("[Wrapper] Fetch Active Drivers Error:", message);
      setError(message); // Set general error state
      showNotification("error", message);
      setActiveDrivers([]); // Ensure it's an empty array on error
    } finally {
      setIsDriversLoading(false);
    }
  }, []);

  const fetchAssignedOrdersForDriver = async (driverId: string) => {
    setIsAssignedOrdersLoading(true);
    setError(null);
    try {
      console.log(
        `[Wrapper] Fetching assigned orders for driver ${driverId}...`
      );
      // *** Ensure this service function is correctly imported and called ***
      const response = await getAssignedOrdersForDriverApi(driverId);
      if (response.success && Array.isArray(response.data)) {
        // *** Use the correct state setter ***
        setAssignedOrders(response.data);
        console.log(
          `[Wrapper] Found ${response.data.length} assigned orders for driver ${driverId}.`
        );
      } else {
        throw new Error(response.message || "Failed to fetch assigned orders");
      }
    } catch (err: any) {
      const message =
        err.message || `Error loading orders for driver ${driverId}.`;
      console.error("[Wrapper] Fetch Assigned Orders Error:", message);
      setError(message);
      showNotification("error", message);
      // *** Use the correct state setter ***
      setAssignedOrders([]); // Ensure empty array on error
    } finally {
      setIsAssignedOrdersLoading(false);
    }
  };

  // Fetch initial data on component mount
  useEffect(() => {
    fetchAssignableOrders();
    fetchActiveDrivers();
  }, [fetchAssignableOrders, fetchActiveDrivers]); // Dependencies

  useEffect(() => {
    // *** Add log to confirm this runs ***
    console.log(
      `[Wrapper] useEffect for selectedDriverId triggered. ID: ${selectedDriverId}`
    );
    if (selectedDriverId) {
      // *** Call the function directly ***
      fetchAssignedOrdersForDriver(selectedDriverId);
    } else {
      // *** Use the correct state setter ***
      setAssignedOrders([]); // Clear assigned orders if no driver is selected
    }
    // *** Dependency array is correct ***
  }, [selectedDriverId]);

  // --- Notification Handling ---
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000); // Auto-hide
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    console.log(`[Wrapper] Notification (${type}): ${message}`);
  };

  // --- Placeholder Handlers (Implement logic later) ---
  const handleAssignOrders = useCallback(
    async (driverId: string, orderIds: string[]) => {
      if (!driverId || orderIds.length === 0) {
        showNotification(
          "error",
          "Please select a driver and at least one order."
        );
        return;
      }
      setIsAssignmentLoading(true);
      showNotification(
        "success",
        `Assigning ${orderIds.length} orders to driver ${driverId}...`
      ); // Placeholder
      console.log(
        `[Wrapper] TODO: Assign Orders - Driver: ${driverId}, Orders:`,
        orderIds
      );
      // --- TODO: Call assignment service API ---
      // Example:
      try {
        const response = await assignOrdersToDriverApi(driverId, orderIds);
        if (response.success) {
          showNotification("success", response.message || "Orders assigned!");
          // Refetch data to update lists
          fetchAssignableOrders();
          // Potentially fetch assigned orders for the selected driver if needed immediately
        } else {
          throw new Error(response.message);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        showNotification("error", message);
      } finally {
        setIsAssignmentLoading(false);
      }
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call
      setIsAssignmentLoading(false);
    },
    [fetchAssignableOrders]
  ); // Dependency needed if refetching

  const handleOptimizeRoute = useCallback(async () => {
    if (!selectedDriverId) {
      showNotification(
        "error",
        "Please select a driver to optimize their route."
      );
      return;
    }
    setIsRouteLoading(true);
    showNotification(
      "success",
      `Optimizing route for driver ${selectedDriverId}...`
    ); // Placeholder
    console.log(`[Wrapper] TODO: Optimize Route - Driver: ${selectedDriverId}`);
    // --- TODO: Call optimization service API ---
    // Example:
    try {
      const response = await optimizeRouteApi(selectedDriverId); // Might need order IDs too
      if (response.success) {
        showNotification("success", response.message || "Route optimized!");
        // Refetch assigned orders for the map/list to show sequence numbers
        // fetchAssignedOrdersForDriver(selectedDriverId);
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      showNotification("error", message);
    } finally {
      setIsRouteLoading(false);
    }
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call
    setIsRouteLoading(false);
  }, [selectedDriverId]);

  const handleSendRoute = useCallback(async () => {
    if (!selectedDriverId) {
      showNotification("error", "Please select a driver to send the route to.");
      return;
    }
    setIsRouteLoading(true);
    showNotification(
      "success",
      `Sending route to driver ${selectedDriverId}...`
    ); // Placeholder
    console.log(`[Wrapper] TODO: Send Route - Driver: ${selectedDriverId}`);
    // --- TODO: Call send route service API ---
    // Example:
    // try {
    //   const response = await sendRouteToDriverApi(selectedDriverId);
    //   if (response.success) {
    //      showNotification("success", response.message || "Route sent!");
    //      // Optionally update order statuses to 'Out for Delivery' via another call or backend logic
    //   } else { throw new Error(response.message); }
    // } catch (err) { showNotification("error", err.message); }
    // finally { setIsRouteLoading(false); }
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call
    setIsRouteLoading(false);
  }, [selectedDriverId]);

  // --- Determine button enable states ---
  const driverHasAssignedOrders = assignedOrders.length > 0;
  const routeIsOptimized = assignedOrders.some(
    (o) => typeof o.deliverySequence === "number" && o.deliverySequence !== null
  );
  // --- Render Logic ---
  return (
    <div>
      {/* --- Notification Area --- */}
      {notification && (
        <div
          className={`alert ${
            notification.type === "success" ? "alert-success" : "alert-danger"
          } alert-dismissible fade show`}
          role="alert"
        >
          {notification.message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setNotification(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* --- General Error Display --- */}
      {error &&
        !notification && ( // Show general error if no specific notification is active
          <div className="alert alert-danger" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

      {/* --- Main Content Layout (Example: Two Columns) --- */}
      <div className="row g-3">
        {" "}
        {/* Use Bootstrap grid with gutters */}
        {/* Column 1: Assignment Panel */}
        <div className="col-lg-5 col-md-12">
          {" "}
          {/* Adjust column sizes as needed */}
          <h4>Assign Deliveries</h4>
          {/* Placeholder for AssignmentPanel component */}
          <div className="card placeholder-glow">
            <div className="card-body">
              <p>AssignmentPanel Component Placeholder</p>
              <p>
                Loading Assignable Orders: {isAssignableLoading ? "Yes" : "No"}
              </p>
              <p>Loading Active Drivers: {isDriversLoading ? "Yes" : "No"}</p>
              <p>Selected Driver ID: {selectedDriverId || "None"}</p>
              <button
                className="btn btn-secondary mt-2"
                disabled={isAssignmentLoading}
              >
                {isAssignmentLoading
                  ? "Assigning..."
                  : "Assign Orders (Placeholder)"}
              </button>
              {/* Render AssignmentPanel component here later */}
              <AssignmentPanel
                pendingOrders={assignableOrders}
                activeDrivers={activeDrivers}
                selectedDriverId={selectedDriverId}
                onDriverSelect={setSelectedDriverId}
                onAssign={handleAssignOrders}
                isLoading={assignmentPanelIsLoading}
              />
            </div>
          </div>
        </div>
        {/* Column 2: Map View and Route Controls */}
        <div className="col-lg-7 col-md-12">
          {" "}
          {/* Adjust column sizes */}
          <h4>
            Route Map & Controls{" "}
            {selectedDriverId
              ? `(Driver: ${
                  activeDrivers.find((d) => d._id === selectedDriverId)
                    ?.fullName ?? selectedDriverId
                })`
              : ""}
          </h4>
          {/* Placeholder for MapView component */}
          <div className="card placeholder-glow mb-3">
            <div className="card-body map-container">
              {" "}
              {/* Use map-container class */}
              <p>DeliveryMapView Component Placeholder</p>
              <p>Selected Driver ID: {selectedDriverId || "None"}</p>
              {/* Render DeliveryMapView component here later */}
              <DeliveryMapView
                assignedOrders={assignedOrders} // Use this variable
                isLoading={isAssignedOrdersLoading} // Use this variable
                key={selectedDriverId || "no-driver"}
              />
            </div>
          </div>
          {/* Placeholder for RouteControls component */}
          <div className="card placeholder-glow">
            <div className="card-body">
              <p>RouteControls Component Placeholder</p>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-info"
                  onClick={handleOptimizeRoute}
                  disabled={!selectedDriverId || isRouteLoading}
                >
                  {isRouteLoading ? "Optimizing..." : "Optimize Route"}
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleSendRoute}
                  disabled={!selectedDriverId || isRouteLoading}
                >
                  {isRouteLoading ? "Sending..." : "Send Route to Driver"}
                </button>
              </div>
              {/* Render RouteControls component here later */}
              <RouteControls
                selectedDriverId={selectedDriverId}
                onOptimize={handleOptimizeRoute}
                onSend={handleSendRoute}
                isLoading={isRouteLoading}
                // --- ADD THESE TWO LINES BELOW ---
                canOptimize={!!selectedDriverId && driverHasAssignedOrders}
                canSend={
                  !!selectedDriverId &&
                  driverHasAssignedOrders /* && routeIsOptimized */
                }
                // ---------------------------------
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryManagerWrapper;
