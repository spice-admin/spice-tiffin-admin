// src/components/admin/RouteOptimizationView.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../../lib/supabaseClient"; // Adjust path as needed
import type {
  Driver,
  DeliveryJob, // From delivery.types.ts
  OptimizedRouteResult, // From delivery.types.ts
  // OrderForAssignment, // Base type for orders, used within OrderToOptimize
} from "../../../types/delivery.types"; // Adjust path as needed
// **** CHANGE IMPORT TO LOCATIONIQ SERVICE ****
import { optimizeRouteWithLocationIQ } from "../../../services/mapService"; // Adjust path
import { format, parseISO, isValid, startOfDay } from "date-fns";
import OrderMap from "./OrderMap"; // We'll add this in the next step

const formatDateForSupabase = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

const mapboxTokenFromEnv = import.meta.env.PUBLIC_MAPBOX_ACCESS_TOKEN;

interface AssignmentWithNestedOrder {
  id: string; // daily_assignment_id
  order_id: string;
  customer_name: string | null;
  customer_phone?: string | null;
  full_delivery_address: string | null;
  package_name: string | null;
  delivery_city: string | null;
  orders: {
    // This should be an OBJECT or null, not an array
    delivery_start_date: string | null;
    delivery_end_date: string | null;
  } | null; // Allows for the case where the joined 'orders' record might not exist or fields are null
}

interface OrderToOptimize {
  // This interface helps structure data before sending to API
  dailyAssignmentId: string;
  orderId: string;
  latitude: number;
  longitude: number;
  customerName: string | null;
  fullDeliveryAddress: string | null;
  packageName: string | null;
  userPhone?: string | null;
  deliveryCity?: string | null;
  // These are for internal consistency if OrderForAssignment was used as base
  id: string;
  user_full_name: string | null;
  delivery_address: string | null;
  delivery_postal_code: string | null;
  delivery_start_date: string | null;
  delivery_end_date: string | null;
}

interface StoredOptimizedRoute {
  id: string;
  driver_id: string | null;
  driver_name: string | null;
  route_date: string;
  start_address_text: string | null;
  start_latitude: number;
  start_longitude: number;
  optimized_order_sequence: DeliveryJob[];
  mapbox_route_geometry: string | null; // Stores polyline from LocationIQ (name can be genericized later)
  total_duration_seconds: number | null;
  total_distance_meters: number | null;
  status: string;
  optimized_at: string;
}

const RouteOptimizationView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(
    startOfDay(new Date())
  );
  const [driversWithAssignments, setDriversWithAssignments] = useState<
    Driver[]
  >([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [ordersToOptimize, setOrdersToOptimize] = useState<OrderToOptimize[]>(
    []
  );
  const [transientOptimizationResult, setTransientOptimizationResult] =
    useState<OptimizedRouteResult | null>(null);
  const [storedOptimizedRoute, setStoredOptimizedRoute] =
    useState<StoredOptimizedRoute | null>(null);

  const [isLoading, setIsLoading] = useState({
    drivers: false,
    assignments: false,
    optimizing: false,
    savingRoute: false,
    fetchingRoute: false,
  });
  const [error, setError] = useState<string | null>(null);

  const START_LOCATION_COORDS: [number, number] = [
    -79.25445232067732, 43.75300368666418,
  ]; // Lng, Lat
  const START_LOCATION_ADDRESS =
    "817 Brimley Rd, Scarborough, ON M1J 1C9, Canada";

  const setLoading = (key: keyof typeof isLoading, value: boolean) => {
    setIsLoading((prev) => ({ ...prev, [key]: value }));
  };

  const startLocationForMap = useMemo(
    () => ({
      coordinates: START_LOCATION_COORDS,
      name: START_LOCATION_ADDRESS,
    }),
    []
  );

  // --- DATA FETCHING FUNCTIONS ---
  // fetchDriversWithAssignmentsForDate (no changes needed from previous version)
  const fetchDriversWithAssignmentsForDate = useCallback(async (date: Date) => {
    setLoading("drivers", true);
    setError(null);
    const dateString = formatDateForSupabase(date);
    try {
      const { data: assignmentData, error: distinctError } = await supabase
        .from("driver_assignments")
        .select("driver_id")
        .eq("assigned_date", dateString)
        .not("driver_id", "is", null);

      if (distinctError) throw distinctError;
      if (!assignmentData || assignmentData.length === 0) {
        setDriversWithAssignments([]);
        return;
      }
      const uniqueDriverIds = [
        ...new Set(
          assignmentData.map((a) => a.driver_id).filter((id) => id !== null)
        ),
      ] as string[];

      if (uniqueDriverIds.length === 0) {
        setDriversWithAssignments([]);
        return;
      }
      const { data: driversData, error: driversError } = await supabase
        .from("drivers")
        .select("id, full_name, is_active")
        .in("id", uniqueDriverIds)
        .eq("is_active", true);

      if (driversError) throw driversError;
      setDriversWithAssignments((driversData || []) as Driver[]);
    } catch (err: any) {
      console.error("Error fetching drivers with assignments:", err);
      setError(`Failed to fetch drivers: ${err.message}`);
      setDriversWithAssignments([]);
    } finally {
      setLoading("drivers", false);
    }
  }, []);

  // fetchDriverDataForOptimization (no changes needed in its core logic from previous version)
  // It fetches from driver_assignments, then geocoded_addresses, or loads an existing optimized_daily_routes.
  const fetchDriverDataForOptimization = useCallback(
    async (driverId: string, date: Date) => {
      if (!driverId) {
        setOrdersToOptimize([]);
        setStoredOptimizedRoute(null); // Clear stored route if no driver
        setTransientOptimizationResult(null);
        return;
      }
      setLoading("assignments", true);
      setLoading("fetchingRoute", true);
      setError(null);
      setTransientOptimizationResult(null);

      const dateString = formatDateForSupabase(date);
      try {
        const { data: existingRouteData, error: existingRouteError } =
          await supabase
            .from("optimized_daily_routes")
            .select(
              `
        id, driver_id, driver_name, route_date, start_address_text, start_latitude, start_longitude,
        optimized_order_sequence, mapbox_route_geometry, total_duration_seconds,
        total_distance_meters, status, optimized_at 
      `
            )
            .eq("driver_id", driverId)
            .eq("route_date", dateString)
            .single();

        if (existingRouteError && existingRouteError.code !== "PGRST116") {
          console.error(
            "Supabase error fetching existing route:",
            existingRouteError
          );
          throw existingRouteError;
        }

        if (existingRouteData) {
          console.log(
            "Found existing optimized route in DB:",
            existingRouteData
          );
          setStoredOptimizedRoute(existingRouteData as StoredOptimizedRoute);
          // ... (logic to populate ordersToOptimize from storedOptimizedRoute - this should be fine)
          const ordersFromStoredSequence = (
            existingRouteData.optimized_order_sequence as DeliveryJob[]
          ).map((job) => ({
            dailyAssignmentId: job.id,
            orderId: job.order_id,
            latitude: job.coordinates[1],
            longitude: job.coordinates[0],
            customerName: job.customer_name,
            fullDeliveryAddress: job.full_delivery_address,
            packageName: job.package_name,
            userPhone: job.user_phone,
            deliveryCity: job.delivery_city,
            id: job.order_id,
            user_full_name: job.customer_name,
            delivery_address: job.full_delivery_address?.split(",")[0] || "",
            delivery_postal_code:
              job.full_delivery_address?.split(",").pop()?.trim() || "",
            delivery_start_date: "",
            delivery_end_date: "",
          }));
          setOrdersToOptimize(ordersFromStoredSequence);
          setLoading("assignments", false);
          setLoading("fetchingRoute", false);
          return;
        }
        setStoredOptimizedRoute(null);

        const { data, error: assignmentsError } = await supabase
          .from("driver_assignments")
          .select(
            `
        id, 
        order_id,
        customer_name, 
        customer_phone, 
        full_delivery_address, 
        package_name,
        delivery_city,
        orders (delivery_start_date, delivery_end_date) 
      `
          )
          .eq("driver_id", driverId)
          .eq("assigned_date", dateString)
          .eq("status", "Pending");

        const assignments = data as AssignmentWithNestedOrder[] | null;
        if (assignmentsError) throw assignmentsError;

        if (!assignments || assignments.length === 0) {
          setOrdersToOptimize([]);
          setLoading("assignments", false);
          setLoading("fetchingRoute", false);
          return;
        }

        const orderIds = assignments.map((a) => a.order_id);
        if (orderIds.length === 0) {
          setOrdersToOptimize([]);
          setLoading("assignments", false);
          setLoading("fetchingRoute", false);
          return;
        }

        const { data: coordsData, error: coordsError } = await supabase
          .from("geocoded_addresses")
          .select("order_id, latitude, longitude")
          .in("order_id", orderIds);

        if (coordsError) throw coordsError;

        const coordsMap = new Map(
          coordsData?.map((c) => [
            c.order_id,
            { lat: c.latitude, lng: c.longitude },
          ])
        );

        const ordersReadyForOpt: OrderToOptimize[] = assignments
          .map((assignment) => {
            const coords = coordsMap.get(assignment.order_id);
            return {
              dailyAssignmentId: assignment.id,
              orderId: assignment.order_id,
              latitude: coords?.lat ?? 0,
              longitude: coords?.lng ?? 0,
              customerName: assignment.customer_name,
              fullDeliveryAddress: assignment.full_delivery_address,
              packageName: assignment.package_name,
              userPhone: assignment.customer_phone,
              deliveryCity: assignment.delivery_city,
              id: assignment.order_id,
              user_full_name: assignment.customer_name,
              delivery_address:
                assignment.full_delivery_address?.split(",")[0] || "",
              delivery_postal_code:
                assignment.full_delivery_address?.split(",").pop()?.trim() ||
                "",
              // @ts-ignore
              delivery_start_date:
                assignment.orders?.delivery_start_date || null,
              // @ts-ignore
              delivery_end_date: assignment.orders?.delivery_end_date || null,
            };
          })
          .filter((order) => order.latitude !== 0 && order.longitude !== 0);

        setOrdersToOptimize(ordersReadyForOpt);
      } catch (err: any) {
        console.error("Error in fetchDriverDataForOptimization:", err);
        setError(`Failed to fetch driver data: ${err.message}`);
        setOrdersToOptimize([]); // Clear orders on error
        setStoredOptimizedRoute(null);
      } finally {
        setLoading("assignments", false);
        setLoading("fetchingRoute", false);
      }
    },
    []
  );

  // useEffect hooks (no changes needed from previous version)
  useEffect(() => {
    fetchDriversWithAssignmentsForDate(selectedDate);
    setSelectedDriverId("");
    setOrdersToOptimize([]);
    setTransientOptimizationResult(null);
    setStoredOptimizedRoute(null);
  }, [selectedDate, fetchDriversWithAssignmentsForDate]);

  useEffect(() => {
    if (selectedDriverId) {
      fetchDriverDataForOptimization(selectedDriverId, selectedDate);
    } else {
      setOrdersToOptimize([]);
      setTransientOptimizationResult(null);
      setStoredOptimizedRoute(null);
    }
  }, [selectedDriverId, selectedDate, fetchDriverDataForOptimization]);

  // --- MODIFIED `handleOptimizeRoute` to call LocationIQ service ---
  const handleOptimizeRoute = async () => {
    if (!selectedDriverId) {
      alert("Please select a driver.");
      return;
    }
    if (ordersToOptimize.length === 0) {
      alert(
        "No assigned and geocoded orders available to optimize for this driver."
      );
      return;
    }
    if (storedOptimizedRoute) {
      if (
        !window.confirm(
          "An optimized route already exists. Do you want to re-calculate and overwrite it?"
        )
      ) {
        return;
      }
    }

    setLoading("optimizing", true);
    setError(null);
    setTransientOptimizationResult(null);

    // Prepare DeliveryJob array for the optimization service
    // Each job's 'id' should be the unique identifier for that stop (e.g., daily_assignment_id)
    // Coordinates are [longitude, latitude]
    const deliveryJobsForApi: DeliveryJob[] = ordersToOptimize.map((order) => ({
      id: order.dailyAssignmentId, // This ID will be returned by API in the ordered sequence
      coordinates: [order.longitude, order.latitude],
      // Include all other data you want to carry through to the final stored sequence
      order_id: order.orderId,
      customer_name: order.customerName,

      full_delivery_address: order.fullDeliveryAddress,
      package_name: order.packageName,
      user_phone: order.userPhone,
      delivery_city: order.deliveryCity,
    }));

    // **** CALL THE NEW LocationIQ SERVICE FUNCTION ****
    const optimizationResult = await optimizeRouteWithLocationIQ(
      START_LOCATION_COORDS, // Start coordinates [lng, lat]
      deliveryJobsForApi // Array of delivery stops
    );

    if (optimizationResult) {
      setTransientOptimizationResult(optimizationResult);
      await handleSaveOptimizedRoute(optimizationResult);
    } else {
      const errorMessage =
        "Route optimization with LocationIQ failed. Check console for details.";
      setError(errorMessage);
      alert(
        errorMessage +
          " Please ensure addresses are correct and API limits are not exceeded."
      );
    }
    setLoading("optimizing", false);
  };

  // handleSaveOptimizedRoute (no changes needed in its core logic, just ensure field names match)
  // The `recordForDB.mapbox_route_geometry` will now store LocationIQ's polyline.
  // The `recordForDB.optimized_order_sequence` will store `routeDataToSave.orderedJobs` (which are DeliveryJob[])
  const handleSaveOptimizedRoute = async (
    routeDataToSave: OptimizedRouteResult
  ) => {
    if (!selectedDriverId) return;
    setLoading("savingRoute", true);
    setError(null);

    const driver = driversWithAssignments.find(
      (d) => d.id === selectedDriverId
    );

    const recordForDB: Omit<
      StoredOptimizedRoute,
      "id" | "optimized_at" | "created_at" | "updated_at"
    > & { optimized_at?: string } = {
      driver_id: selectedDriverId,
      driver_name: driver?.full_name || null,
      route_date: formatDateForSupabase(selectedDate),
      start_address_text: START_LOCATION_ADDRESS,
      start_latitude: START_LOCATION_COORDS[1], // Lat
      start_longitude: START_LOCATION_COORDS[0], // Lng
      optimized_order_sequence: routeDataToSave.orderedJobs, // This is DeliveryJob[]
      mapbox_route_geometry: routeDataToSave.routeGeometry, // Will store LocationIQ polyline
      total_duration_seconds: routeDataToSave.totalDurationSeconds,
      total_distance_meters: routeDataToSave.totalDistanceMeters,
      status: "generated",
      optimized_at: new Date().toISOString(), // Set explicitly
    };

    try {
      const { data: savedData, error: upsertError } = await supabase
        .from("optimized_daily_routes")
        .upsert(recordForDB, {
          onConflict: "driver_id, route_date",
        })
        .select()
        .single();

      if (upsertError) throw upsertError;

      alert("Optimized route saved successfully using LocationIQ!");
      setStoredOptimizedRoute(savedData as StoredOptimizedRoute);
      setTransientOptimizationResult(null);
      // Re-fetch to ensure display consistency, especially for the stored route view
      fetchDriverDataForOptimization(selectedDriverId, selectedDate);
    } catch (err: any) {
      console.error("Error saving optimized route:", err);
      setError(`Failed to save route: ${err.message}`);
      alert(`Failed to save route: ${err.message}`);
    } finally {
      setLoading("savingRoute", false);
    }
  };

  // --- Determine what to display (transient API result or stored DB result) ---
  const displayRouteData = useMemo(() => {
    if (transientOptimizationResult) return transientOptimizationResult;
    if (storedOptimizedRoute) {
      return {
        orderedJobs: storedOptimizedRoute.optimized_order_sequence,
        routeGeometry: storedOptimizedRoute.mapbox_route_geometry || "",
        totalDurationSeconds: storedOptimizedRoute.total_duration_seconds || 0,
        totalDistanceMeters: storedOptimizedRoute.total_distance_meters || 0,
      };
    }
    return null;
  }, [transientOptimizationResult, storedOptimizedRoute]);

  // --- JSX ---
  // The JSX structure from the previous step remains largely the same.
  // The "Optimize & Save Route" button will now trigger the logic using LocationIQ.
  // The map placeholder will eventually display the route from 'displayRouteData.routeGeometry'.
  return (
    <div className="route-optimization-module">
      {/* ... (Your existing JSX for title, error, filters, button, and display sections) ... */}
      {/* Ensure the button onClick calls handleOptimizeRoute */}
      {/* The map placeholder will later use displayRouteData.routeGeometry and displayRouteData.orderedJobs */}

      <h1>Route Optimization</h1>
      {error && <p className="error-message">Error: {error}</p>}

      <div className="filters-container">
        {/* ... Date and Driver Selectors ... */}
        <div className="filter-item">
          <label htmlFor="optRouteDate">Date:</label>
          <input
            type="date"
            id="optRouteDate"
            value={formatDateForSupabase(selectedDate)}
            onChange={(e) => {
              const newDate = parseISO(e.target.value);
              if (isValid(newDate)) setSelectedDate(startOfDay(newDate));
            }}
            disabled={
              isLoading.optimizing ||
              isLoading.savingRoute ||
              isLoading.drivers ||
              isLoading.assignments
            }
          />
        </div>
        <div className="filter-item">
          <label htmlFor="optRouteDriver">Driver:</label>
          <select
            id="optRouteDriver"
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            disabled={
              isLoading.drivers ||
              isLoading.optimizing ||
              isLoading.savingRoute ||
              isLoading.assignments ||
              driversWithAssignments.length === 0
            }
          >
            <option value="">Select Driver</option>
            {driversWithAssignments.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading.drivers && (
        <p className="loading-placeholder">Loading drivers...</p>
      )}

      {selectedDriverId && isLoading.assignments && (
        <p className="loading-placeholder">Loading assignments for driver...</p>
      )}

      {selectedDriverId && !isLoading.assignments && (
        <>
          {ordersToOptimize.length > 0 &&
            !storedOptimizedRoute &&
            !transientOptimizationResult && (
              <p className="info-text">
                {ordersToOptimize.length} geocoded and pending assignments found
                for this driver. Ready to optimize.
              </p>
            )}
          {ordersToOptimize.length === 0 && !storedOptimizedRoute && (
            <p className="info-text">
              No geocoded 'Pending' assignments found for this driver on{" "}
              {format(selectedDate, "MMMM dd, yyyy")} to optimize.
            </p>
          )}
          {storedOptimizedRoute && (
            <p className="info-text success-text">
              An optimized route already exists for this driver and date. You
              can re-optimize if needed.
            </p>
          )}

          <button
            onClick={handleOptimizeRoute}
            disabled={
              isLoading.optimizing ||
              isLoading.savingRoute ||
              ordersToOptimize.length === 0
            }
            className="button button-optimize"
          >
            {isLoading.optimizing
              ? "Optimizing with LocationIQ..."
              : isLoading.savingRoute
              ? "Saving Route..."
              : storedOptimizedRoute
              ? `Re-Optimize & Save (${ordersToOptimize.length} stops)`
              : `Optimize & Save with LocationIQ (${ordersToOptimize.length} stops)`}
          </button>
        </>
      )}

      {displayRouteData && (
        <div className="optimized-route-details-section">
          <h2>
            Optimized Route for{" "}
            {driversWithAssignments.find((d) => d.id === selectedDriverId)
              ?.full_name || "Selected Driver"}
            {storedOptimizedRoute && (
              <span className="status-chip">
                Status: {storedOptimizedRoute.status}
              </span>
            )}
          </h2>

          <div className="route-summary">
            <p>
              <strong>Total Stops:</strong>{" "}
              {displayRouteData.orderedJobs.length}
            </p>
            {displayRouteData.totalDurationSeconds > 0 && (
              <p>
                <strong>Est. Duration:</strong>{" "}
                {Math.round(displayRouteData.totalDurationSeconds / 60)} mins
              </p>
            )}
            {displayRouteData.totalDistanceMeters > 0 && (
              <p>
                <strong>Est. Distance:</strong>{" "}
                {(displayRouteData.totalDistanceMeters / 1000).toFixed(2)} km
              </p>
            )}
          </div>

          <div className="map-and-sequence-container">
            <div className="optimized-map-container">
              {mapboxTokenFromEnv ? (
                <OrderMap
                  stops={displayRouteData ? displayRouteData.orderedJobs : []}
                  routePolyline={
                    displayRouteData ? displayRouteData.routeGeometry : null
                  }
                  startLocation={startLocationForMap}
                  mapboxToken={mapboxTokenFromEnv}
                />
              ) : (
                <div
                  id="optimized-route-map-placeholder"
                  className="order-map-placeholder"
                >
                  <p style={{ color: "red" }}>
                    Mapbox Access Token is missing.
                  </p>
                  <p>
                    Please configure PUBLIC_MAPBOX_ACCESS_TOKEN in your
                    environment.
                  </p>
                </div>
              )}
            </div>
            <div className="optimized-sequence-list">
              <h3>Stop Sequence:</h3>
              <ol>
                <li>
                  <strong>Start:</strong> {START_LOCATION_ADDRESS}
                </li>
                {displayRouteData.orderedJobs.map((job, index) => (
                  <li key={job.id}>
                    {" "}
                    {/* job.id is daily_assignment_id */}
                    {index + 1}. <strong>{job.customer_name || "N/A"}</strong> (
                    {job.package_name || "N/A"})<br />
                    <small>
                      <em>Ph: {job.user_phone || "N/A"}</em>
                    </small>
                    <br />
                    <small>
                      {job.full_delivery_address || "Address not available"}
                    </small>
                    <br />
                    <small>(Order ID: {job.order_id.substring(0, 8)}...)</small>
                  </li>
                ))}
                <li>
                  <strong>End:</strong> Last Delivery
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}
      {/* Add relevant CSS to your stylesheet for these classes */}
    </div>
  );
};

export default RouteOptimizationView;
