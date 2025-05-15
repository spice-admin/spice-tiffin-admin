// src/components/admin/AssignDeliveries.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../../lib/supabaseClient"; // Adjust path if needed
import type {
  OrderForAssignment,
  Driver,
  City,
  DeliveryScheduleEntry,
  StagedAssignmentGroup,
  ConfirmedAssignmentDisplay,
  DriverAssignmentDBRecord,
  DeliveryJob, // Import DeliveryJob for mapStops
} from "../../../types/delivery.types"; // Adjust path if needed
import { format, parseISO, isValid, startOfDay } from "date-fns";
import { geocodeAddress } from "../../../services/mapService"; // Adjust path if needed
import "./assign-deliveries.css"; // Assuming CSS is imported in Astro page or globally
import OrderMap from "./OrderMap"; // Import OrderMap

const formatDateForSupabase = (date: Date): string => {
  return format(date, "yyyy-MM-dd");
};

interface CoordinateStatus {
  latitude?: number;
  longitude?: number;
  error?: string;
  geocoded: boolean;
}

const AssignDeliveries: React.FC = () => {
  const [currentAssignmentDate, setCurrentAssignmentDate] = useState<Date>(
    startOfDay(new Date())
  );
  const [isRestaurantOpen, setIsRestaurantOpen] = useState<boolean | null>(
    null
  );
  const [operationNotes, setOperationNotes] = useState<string | null>(null);
  const [assignableOrders, setAssignableOrders] = useState<
    OrderForAssignment[]
  >([]);
  const [cities, setCities] = useState<City[]>([]);
  const [activeDrivers, setActiveDrivers] = useState<Driver[]>([]);
  const [confirmedAssignmentsForDate, setConfirmedAssignmentsForDate] =
    useState<ConfirmedAssignmentDisplay[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(
    new Set()
  );
  const [stagedAssignments, setStagedAssignments] = useState<
    Record<string, StagedAssignmentGroup>
  >({});
  const [orderCoordinates, setOrderCoordinates] = useState<
    Record<string, CoordinateStatus>
  >({});
  const [isGeocodingInProgress, setIsGeocodingInProgress] =
    useState<boolean>(false);
  const [geocodingProgress, setGeocodingProgress] = useState<{
    current: number;
    total: number;
    message: string;
  }>({ current: 0, total: 0, message: "" });

  const [isLoading, setIsLoading] = useState({
    schedule: true, // Start with true for initial load
    orders: true,
    cities: true,
    drivers: true,
    confirmed: true,
    staging: false,
    confirming: false,
  });
  const [error, setError] = useState<string | null>(null);

  const [selectedDriverForConfirmed, setSelectedDriverForConfirmed] =
    useState<string>("");

  const [isProofModalOpen, setIsProofModalOpen] = useState<boolean>(false);
  const [proofingImageUrl, setProofingImageUrl] = useState<string | null>(null);

  const setLoading = (key: keyof typeof isLoading, value: boolean) => {
    setIsLoading((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfirmedDriverFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedDriverForConfirmed(event.target.value);
  };

  // --- DATA FETCHING FUNCTIONS ---
  const fetchDeliveryScheduleStatus = useCallback(async (date: Date) => {
    setLoading("schedule", true);
    setError(null);
    try {
      const dateString = formatDateForSupabase(date);
      const { data, error: dbError } = await supabase
        .from("delivery_schedule")
        .select("is_delivery_enabled, notes")
        .eq("event_date", dateString)
        .single();
      if (dbError && dbError.code !== "PGRST116") throw dbError;
      if (data) {
        setIsRestaurantOpen(data.is_delivery_enabled);
        setOperationNotes(
          data.notes ||
            (data.is_delivery_enabled
              ? "Open for deliveries."
              : "Closed for deliveries.")
        );
      } else {
        setIsRestaurantOpen(false);
        setOperationNotes(
          "Delivery schedule not set for this date. Assuming closed."
        );
      }
    } catch (err: any) {
      console.error("Error fetching delivery schedule:", err);
      setError(`Schedule Error: ${err.message}`);
      setIsRestaurantOpen(false);
    } finally {
      setLoading("schedule", false);
    }
  }, []);

  const fetchCities = useCallback(async () => {
    /* ... (same as your last working version, with setLoading) ... */
    setLoading("cities", true);
    try {
      const { data, error: dbError } = await supabase
        .from("cities")
        .select("id, name")
        .order("name");
      if (dbError) throw dbError;
      setCities(data || []);
    } catch (err: any) {
      console.error("Error fetching cities:", err);
    } finally {
      setLoading("cities", false);
    }
  }, []);

  const fetchActiveDrivers = useCallback(async () => {
    /* ... (same as your last working version, with setLoading) ... */
    setLoading("drivers", true);
    try {
      const { data, error: dbError } = await supabase
        .from("drivers")
        .select("id, full_name, phone, is_active")
        .eq("is_active", true)
        .order("full_name");
      if (dbError) throw dbError;
      setActiveDrivers(data || []);
    } catch (err: any) {
      console.error("Error fetching active drivers:", err);
    } finally {
      setLoading("drivers", false);
    }
  }, []);

  const fetchConfirmedAssignments = useCallback(
    async (date: Date): Promise<ConfirmedAssignmentDisplay[]> => {
      /* ... (same as your last working version, with setLoading) ... */
      setLoading("confirmed", true);
      const dateString = formatDateForSupabase(date);
      try {
        const { data, error: dbError } = await supabase
          .from("driver_assignments")
          .select(
            `id, order_id, driver_id, assigned_date, status, proof_of_delivery_url, driver_name, customer_name, full_delivery_address, package_name`
          )
          .eq("assigned_date", dateString);
        if (dbError) throw dbError;
        const mappedData: ConfirmedAssignmentDisplay[] = (data || []).map(
          (item) => ({
            /* your mapping */ assignmentId: item.id,
            orderId: item.order_id,
            driverId: item.driver_id,
            driverName: item.driver_name,
            assignedDate: item.assigned_date,
            status: item.status,
            customerName: item.customer_name,
            fullDeliveryAddress: item.full_delivery_address,
            packageName: item.package_name,
            proof_of_delivery_url: item.proof_of_delivery_url,
          })
        );
        setConfirmedAssignmentsForDate(mappedData);
        return mappedData;
      } catch (err: any) {
        console.error("Error fetching confirmed assignments:", err);
        return [];
      } finally {
        setLoading("confirmed", false);
      }
    },
    []
  );

  const fetchAssignableOrders = useCallback(
    async (
      date: Date,
      alreadyConfirmedDBOrderIds: string[],
      currentStagedAssignments: Record<string, StagedAssignmentGroup>
    ) => {
      if (isRestaurantOpen === false) {
        setAssignableOrders([]);
        return;
      } // Check explicit false
      setLoading("orders", true);
      const dateString = formatDateForSupabase(date);
      try {
        let query = supabase
          .from("orders")
          .select(
            "id, user_full_name, user_phone, delivery_address, delivery_city, delivery_postal_code, package_name, delivery_start_date, delivery_end_date"
          ) // Ensure user_phone is selected
          .lte("delivery_start_date", dateString)
          .gte("delivery_end_date", dateString);
        if (selectedCity) query = query.eq("delivery_city", selectedCity);
        const { data: fetchedOrdersFromDB, error: dbError } = await query;
        if (dbError) throw dbError;
        const stagedOrderIdsInCurrentSession = Object.values(
          currentStagedAssignments
        ).flatMap((group) => group.orders.map((order) => order.id));
        const allExcludedOrderIds = new Set([
          ...alreadyConfirmedDBOrderIds,
          ...stagedOrderIdsInCurrentSession,
        ]);
        const availableOrders = (fetchedOrdersFromDB || []).filter(
          (order) => !allExcludedOrderIds.has(order.id)
        );
        setAssignableOrders(availableOrders as OrderForAssignment[]);
      } catch (err: any) {
        console.error("Error fetching assignable orders:", err);
        setAssignableOrders([]);
      } finally {
        setLoading("orders", false);
      }
    },
    [isRestaurantOpen, selectedCity]
  ); // Removed stagedAssignments from here as it's passed as arg now.

  // Main data loading effects
  useEffect(() => {
    fetchDeliveryScheduleStatus(currentAssignmentDate);
    fetchCities();
    fetchActiveDrivers();
  }, [
    currentAssignmentDate,
    fetchDeliveryScheduleStatus,
    fetchCities,
    fetchActiveDrivers,
  ]);

  useEffect(() => {
    if (isRestaurantOpen === null) return;
    const loadData = async () => {
      const confirmed = await fetchConfirmedAssignments(currentAssignmentDate);
      const confirmedOrderIdsFromDB = confirmed.map((a) => a.orderId);
      if (isRestaurantOpen) {
        fetchAssignableOrders(
          currentAssignmentDate,
          confirmedOrderIdsFromDB,
          stagedAssignments
        );
      } else {
        setAssignableOrders([]);
      }
    };
    loadData();
  }, [
    currentAssignmentDate,
    selectedCity,
    isRestaurantOpen,
    fetchConfirmedAssignments,
    fetchAssignableOrders,
    stagedAssignments,
  ]);

  // Effect to fetch stored coordinates for newly listed assignable orders
  useEffect(() => {
    if (assignableOrders.length === 0) return;
    const fetchStoredCoordinates = async () => {
      const orderIdsToCheck = assignableOrders
        .filter((o) => !orderCoordinates[o.id]?.geocoded)
        .map((o) => o.id);
      if (orderIdsToCheck.length === 0) return;
      const { data, error } = await supabase
        .from("geocoded_addresses")
        .select("order_id, latitude, longitude")
        .in("order_id", orderIdsToCheck);
      if (error) {
        console.error("Error fetching stored coordinates:", error);
        return;
      }
      if (data) {
        setOrderCoordinates((prevCoords) => {
          const newCoords = { ...prevCoords };
          data.forEach((coordEntry) => {
            newCoords[coordEntry.order_id] = {
              latitude: coordEntry.latitude,
              longitude: coordEntry.longitude,
              geocoded: true,
            };
          });
          return newCoords;
        });
      }
    };
    fetchStoredCoordinates();
  }, [assignableOrders]); // Re-run when assignableOrders list changes

  // --- EVENT HANDLERS (handleDateChange, etc. - keep existing, ensure user_phone is in OrderForAssignment for denormalization) ---
  // handleConfirmAllStagedAssignments: Make sure 'customer_phone: order.user_phone' is correctly picking up data
  // This means OrderForAssignment (which 'order' is an instance of in that loop) MUST have user_phone.
  // I added user_phone to the select in fetchAssignableOrders and to OrderForAssignment type in the previous step.
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = parseISO(event.target.value);
    if (isValid(newDate)) {
      setCurrentAssignmentDate(startOfDay(newDate));
      setSelectedOrderIds(new Set());
      setStagedAssignments({});
      setOrderCoordinates({});
    }
  };

  const handleCityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(event.target.value);
  };

  const handleDriverChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDriverId(event.target.value);
  };

  const handleOrderSelectionChange = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(orderId)) {
        newSelection.delete(orderId);
      } else {
        newSelection.add(orderId);
      }
      return newSelection;
    });
  };

  const handleStageForDriver = () => {
    /* ... (Your existing logic should be fine) ... */
    if (!selectedDriverId) {
      alert("Please select a driver.");
      return;
    }
    if (selectedOrderIds.size === 0) {
      alert("Please select at least one order to stage.");
      return;
    }
    setLoading("staging", true);
    const driver = activeDrivers.find((d) => d.id === selectedDriverId);
    if (!driver) {
      alert("Selected driver not found.");
      setLoading("staging", false);
      return;
    }
    const ordersToStage = assignableOrders.filter((order) =>
      selectedOrderIds.has(order.id)
    );
    setStagedAssignments((prevStaged) => {
      const newStaged = { ...prevStaged };
      const existingDriverOrders = newStaged[selectedDriverId]?.orders || [];
      const newOrdersForDriver = ordersToStage.filter(
        (order) =>
          !existingDriverOrders.some(
            (stagedOrder) => stagedOrder.id === order.id
          )
      );
      if (!newStaged[selectedDriverId]) {
        newStaged[selectedDriverId] = {
          driverId: selectedDriverId,
          driverName: driver.full_name,
          orders: newOrdersForDriver,
        };
      } else {
        newStaged[selectedDriverId].orders = [
          ...existingDriverOrders,
          ...newOrdersForDriver,
        ];
      }
      return newStaged;
    });
    setAssignableOrders((prevAssignable) =>
      prevAssignable.filter((order) => !selectedOrderIds.has(order.id))
    );
    setSelectedOrderIds(new Set());
    setLoading("staging", false);
  };

  const handleUnstageOrder = (driverId: string, orderIdToUnstage: string) => {
    /* ... (Your existing logic should be fine) ... */
    const orderToMoveBack = stagedAssignments[driverId]?.orders.find(
      (o) => o.id === orderIdToUnstage
    );
    setStagedAssignments((prev) => {
      const newStaged = { ...prev };
      if (newStaged[driverId]) {
        newStaged[driverId].orders = newStaged[driverId].orders.filter(
          (o) => o.id !== orderIdToUnstage
        );
        if (newStaged[driverId].orders.length === 0) {
          delete newStaged[driverId];
        }
      }
      return newStaged;
    });
    if (orderToMoveBack) {
      if (!selectedCity || orderToMoveBack.delivery_city === selectedCity) {
        setAssignableOrders((prev) =>
          [...prev, orderToMoveBack].sort((a, b) =>
            (a.user_full_name || "").localeCompare(b.user_full_name || "")
          )
        );
      }
    }
  };

  const handleConfirmAllStagedAssignments = async () => {
    /* ... (Your existing logic, ensure order.user_phone is accessed if needed) ... */
    if (Object.keys(stagedAssignments).length === 0) {
      alert("No assignments are staged for confirmation.");
      return;
    }
    setLoading("confirming", true);
    setError(null);
    const recordsToInsert: DriverAssignmentDBRecord[] = [];
    const adminUserIdResult = await supabase.auth.getUser();
    const adminUserId = adminUserIdResult.data.user?.id;
    Object.values(stagedAssignments).forEach((group) => {
      group.orders.forEach((order) => {
        // 'order' here is OrderForAssignment
        recordsToInsert.push({
          order_id: order.id,
          driver_id: group.driverId,
          assigned_date: formatDateForSupabase(currentAssignmentDate),
          status: "Pending",
          assigned_by: adminUserId || undefined,
          driver_name: group.driverName,
          customer_name: order.user_full_name,
          customer_phone: order.user_phone, // Make sure order.user_phone exists on OrderForAssignment
          full_delivery_address: `${order.delivery_address || ""} ${
            order.delivery_city || ""
          } ${order.delivery_postal_code || ""}`
            .replace(/^, |,$/g, "")
            .trim(),
          delivery_city: order.delivery_city,
          package_name: order.package_name,
        });
      });
    });
    try {
      const { error: insertError } = await supabase
        .from("driver_assignments")
        .insert(recordsToInsert);
      if (insertError) {
        if (insertError.message.includes("unique constraint")) {
          throw new Error(
            "One or more orders were already assigned for this date. Please refresh."
          );
        }
        throw insertError;
      }
      alert(`${recordsToInsert.length} assignments confirmed successfully!`);
      setStagedAssignments({});
      const confirmed = await fetchConfirmedAssignments(currentAssignmentDate);
      const confirmedOrderIdsFromDB = confirmed.map((a) => a.orderId);
      if (isRestaurantOpen) {
        fetchAssignableOrders(
          currentAssignmentDate,
          confirmedOrderIdsFromDB,
          {}
        );
      } else {
        setAssignableOrders([]);
      }
    } catch (err: any) {
      console.error("Error confirming assignments:", err);
      setError(`Confirmation failed: ${err.message}`);
      alert(`Confirmation failed: ${err.message}`);
    } finally {
      setLoading("confirming", false);
    }
  };

  // --- GEOCODING LOGIC ---
  const ordersNeedingGeocoding = useMemo(() => {
    /* ... (same as before) ... */
    return assignableOrders.filter(
      (order) => !orderCoordinates[order.id]?.geocoded
    );
  }, [assignableOrders, orderCoordinates]);

  const handleGeocodePendingAddresses = async () => {
    /* ... (same as before, ensure 'order' has all address parts) ... */
    if (ordersNeedingGeocoding.length === 0) {
      alert(
        "All currently visible assignable orders already have coordinates or have had a geocoding attempt."
      );
      return;
    }
    setIsGeocodingInProgress(true);
    setGeocodingProgress({
      current: 0,
      total: ordersNeedingGeocoding.length,
      message: "Starting geocoding...",
    });
    let geocodedCount = 0;
    for (let i = 0; i < ordersNeedingGeocoding.length; i++) {
      const order = ordersNeedingGeocoding[i];
      setGeocodingProgress({
        current: i + 1,
        total: ordersNeedingGeocoding.length,
        message: `Geocoding address for ${order.user_full_name || order.id}...`,
      });
      const fullAddress = `${order.delivery_address || ""}, ${
        order.delivery_city || ""
      }, ${order.delivery_postal_code || ""}, Canada`
        .replace(/^, |,$/g, "")
        .trim();
      if (!fullAddress || fullAddress === ", , Canada") {
        console.warn(
          `Skipping geocoding for order ${order.id} due to insufficient address parts.`
        );
        setOrderCoordinates((prev) => ({
          ...prev,
          [order.id]: { geocoded: true, error: "Insufficient address" },
        }));
        continue;
      }
      const result = await geocodeAddress(fullAddress);
      if (result) {
        const { latitude, longitude } = result;
        const { error: insertError } = await supabase
          .from("geocoded_addresses")
          .insert({
            order_id: order.id,
            full_address_text: fullAddress,
            latitude: latitude,
            longitude: longitude,
            geocoding_provider: "mapbox",
          });
        if (insertError) {
          console.error(
            `Failed to save geocoded address for order ${order.id}:`,
            insertError
          );
          setOrderCoordinates((prev) => ({
            ...prev,
            [order.id]: { geocoded: true, error: "Failed to save coordinates" },
          }));
        } else {
          geocodedCount++;
          setOrderCoordinates((prev) => ({
            ...prev,
            [order.id]: { latitude, longitude, geocoded: true },
          }));
        }
      } else {
        console.warn(
          `Geocoding returned null for order ${order.id}, address: ${fullAddress}`
        );
        setOrderCoordinates((prev) => ({
          ...prev,
          [order.id]: { geocoded: true, error: "Not found" },
        }));
      }
    }
    setGeocodingProgress({
      current: ordersNeedingGeocoding.length,
      total: ordersNeedingGeocoding.length,
      message: `Geocoding complete. ${geocodedCount} new addresses geocoded.`,
    });
    setIsGeocodingInProgress(false);
  };

  const mapDisplayStops = useMemo((): DeliveryJob[] => {
    return assignableOrders
      .map((order) => {
        const coordStatus = orderCoordinates[order.id];
        if (
          coordStatus &&
          coordStatus.geocoded &&
          typeof coordStatus.latitude === "number" &&
          typeof coordStatus.longitude === "number"
        ) {
          return {
            id: order.id,
            coordinates: [coordStatus.longitude, coordStatus.latitude], // [lng, lat]
            order_id: order.id,
            customer_name: order.user_full_name,
            full_delivery_address: `${order.delivery_address || ""}, ${
              order.delivery_city || ""
            } ${order.delivery_postal_code || ""}`
              .replace(/^, |,$/g, "")
              .trim(),
            package_name: order.package_name,
            user_phone: order.user_phone || null, // Ensure user_phone is on OrderForAssignment
            delivery_city: order.delivery_city,
          };
        }
        return null;
      })
      .filter((job): job is DeliveryJob => job !== null); // Type guard to filter out nulls and assert type
  }, [assignableOrders, orderCoordinates]);

  const mapboxTokenFromEnv = import.meta.env.PUBLIC_MAPBOX_ACCESS_TOKEN;
  const selectedDateString = format(currentAssignmentDate, "MMMM dd, yyyy");

  const filteredConfirmedAssignments = useMemo(() => {
    if (!selectedDriverForConfirmed) {
      return confirmedAssignmentsForDate;
    }
    return confirmedAssignmentsForDate.filter(
      (assignment) => assignment.driverId === selectedDriverForConfirmed
    );
  }, [confirmedAssignmentsForDate, selectedDriverForConfirmed]);

  return (
    <div className="delivery-assignment-module">
      <h1>Assign Deliveries for: {selectedDateString}</h1>

      {/* ... (isLoading.schedule, error, isRestaurantOpen !== null checks) ... */}
      {isLoading.schedule && (
        <p className="loading-placeholder">Loading restaurant schedule...</p>
      )}
      {error && <p className="error-message">Error: {error}</p>}

      {isRestaurantOpen !== null && (
        <div
          className={`operation-status ${
            isRestaurantOpen ? "status-open" : "status-closed"
          }`}
        >
          <strong>
            {" "}
            Restaurant Status for {selectedDateString}:{" "}
            {isRestaurantOpen ? "OPEN" : "CLOSED"}{" "}
          </strong>
          {operationNotes && (
            <p>
              <small>{operationNotes}</small>
            </p>
          )}
        </div>
      )}

      {isRestaurantOpen && (
        <>
          {/* --- FILTERS --- */}
          <div className="filters-container">
            {/* ... (Date, City, Driver for Staging dropdowns - no change needed) ... */}
            <div className="filter-item">
              <label htmlFor="assignmentDate">Date:</label>
              <input
                type="date"
                id="assignmentDate"
                value={formatDateForSupabase(currentAssignmentDate)}
                onChange={handleDateChange}
                disabled={
                  isLoading.schedule ||
                  isLoading.orders ||
                  isLoading.confirmed ||
                  isLoading.confirming ||
                  isLoading.staging ||
                  isGeocodingInProgress
                }
              />
            </div>
            <div className="filter-item">
              <label htmlFor="cityFilter">City:</label>
              <select
                id="cityFilter"
                value={selectedCity}
                onChange={handleCityChange}
                disabled={
                  isLoading.cities ||
                  isLoading.orders ||
                  isLoading.confirming ||
                  isLoading.staging ||
                  isGeocodingInProgress
                }
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-item">
              <label htmlFor="driverSelectForStaging">
                {" "}
                Driver to Stage For:{" "}
              </label>
              <select
                id="driverSelectForStaging"
                value={selectedDriverId}
                onChange={handleDriverChange}
                disabled={
                  isLoading.drivers ||
                  isLoading.confirming ||
                  isLoading.staging ||
                  isGeocodingInProgress
                }
              >
                <option value="">Select Driver</option>
                {activeDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* --- GEOCODING SECTION --- */}
          {/* ... (Geocoding button and progress - no change needed) ... */}
          {assignableOrders.length > 0 && (
            <div className="geocoding-section">
              <button
                onClick={handleGeocodePendingAddresses}
                disabled={
                  isGeocodingInProgress || ordersNeedingGeocoding.length === 0
                }
                className="button button-geocode"
              >
                {isGeocodingInProgress
                  ? `Geocoding (${geocodingProgress.current}/${geocodingProgress.total})...`
                  : `Prepare ${ordersNeedingGeocoding.length} Addresses for Map`}
              </button>
              {isGeocodingInProgress && (
                <div className="geocoding-progress-bar-container">
                  {" "}
                  <div
                    className="geocoding-progress-bar"
                    style={{
                      width: `${
                        (geocodingProgress.current /
                          (geocodingProgress.total || 1)) *
                        100
                      }%`,
                    }}
                  ></div>{" "}
                </div>
              )}
              {geocodingProgress.message && (
                <p className="geocoding-message">{geocodingProgress.message}</p>
              )}
            </div>
          )}

          {/* --- MAP CONTAINER & ASSIGNABLE ORDERS TABLE (Side by Side or Stacked) --- */}
          <div className="map-and-orders-container">
            {" "}
            {/* This class can be used for flex/grid layout */}
            <div className="map-view-container">
              <h2>Order Locations ({mapDisplayStops.length} geocoded)</h2>{" "}
              {/* Use mapDisplayStops.length */}
              {mapboxTokenFromEnv ? (
                <OrderMap
                  stops={mapDisplayStops} // **** PASS mapDisplayStops to 'stops' ****
                  mapboxToken={mapboxTokenFromEnv}
                  // routePolyline={null} // No route polyline for this map instance
                  // startLocation={null} // No specific start location for this overview map
                />
              ) : (
                <div className="order-map-placeholder">
                  <p style={{ color: "red" }}>
                    Mapbox Access Token is missing.
                  </p>
                </div>
              )}
            </div>
            <div className="section-assignable-orders">
              <h2>Available Orders ({assignableOrders.length})</h2>
              {/* ... (Assignable orders table - ensure it uses 'assignableOrders' state) ... */}
              {isLoading.orders && (
                <p className="loading-placeholder">Loading orders...</p>
              )}
              {!isLoading.orders && assignableOrders.length === 0 && (
                <p>
                  No orders available for assignment based on current filters.
                </p>
              )}
              {assignableOrders.length > 0 && (
                <>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Select</th>
                          <th>Geocoded</th>
                          <th>Customer</th>
                          <th>Package</th>
                          <th>Address</th>
                          <th>City</th>
                          <th>End Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignableOrders.map((order) => {
                          // Iterate over original assignableOrders
                          const coordStatus = orderCoordinates[order.id];
                          const isGeocodedSuccessfully =
                            coordStatus?.geocoded &&
                            !coordStatus?.error &&
                            coordStatus?.latitude;
                          return (
                            <tr key={order.id}>
                              <td>
                                {" "}
                                <input
                                  type="checkbox"
                                  checked={selectedOrderIds.has(order.id)}
                                  onChange={() =>
                                    handleOrderSelectionChange(order.id)
                                  }
                                  disabled={
                                    isLoading.staging ||
                                    isLoading.confirming ||
                                    isGeocodingInProgress
                                  }
                                />{" "}
                              </td>
                              <td
                                className={`geocode-status ${
                                  isGeocodedSuccessfully
                                    ? "status-geocoded-success"
                                    : coordStatus?.error
                                    ? "status-geocoded-error"
                                    : coordStatus?.geocoded
                                    ? "status-geocoded-error"
                                    : "status-geocoded-needed"
                                }`}
                              >
                                {coordStatus?.geocoded
                                  ? isGeocodedSuccessfully
                                    ? "Yes"
                                    : `Error`
                                  : "No"}
                              </td>
                              <td>{order.user_full_name || "N/A"}</td>
                              <td>{order.package_name || "N/A"}</td>
                              <td>{`${order.delivery_address || ""}, ${
                                order.delivery_postal_code || ""
                              }`}</td>
                              <td>{order.delivery_city || "N/A"}</td>
                              <td>
                                {order.delivery_end_date
                                  ? format(
                                      parseISO(order.delivery_end_date),
                                      "MMM dd, yyyy"
                                    )
                                  : "N/A"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {selectedOrderIds.size > 0 && selectedDriverId && (
                    <button
                      onClick={handleStageForDriver}
                      disabled={
                        isLoading.staging ||
                        isLoading.confirming ||
                        isGeocodingInProgress
                      }
                      className="button button-stage"
                    >
                      {isLoading.staging
                        ? "Staging..."
                        : `Stage ${selectedOrderIds.size} Orders for ${
                            activeDrivers.find((d) => d.id === selectedDriverId)
                              ?.full_name || "Selected Driver"
                          }`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* --- STAGED ASSIGNMENTS --- */}
          {/* ... (Your existing Staged Assignments section - no change) ... */}
          {Object.keys(stagedAssignments).length > 0 && (
            <div className="section-staged-assignments">
              {" "}
              <h2>Staged Assignments (Review Before Confirming)</h2>{" "}
              {Object.values(stagedAssignments).map((group) => (
                <div key={group.driverId} className="staged-driver-group">
                  {" "}
                  <h4>
                    {" "}
                    Driver: {group.driverName} ({group.orders.length} order(s)){" "}
                  </h4>{" "}
                  <ul>
                    {" "}
                    {group.orders.map((order) => (
                      <li key={order.id}>
                        {" "}
                        <span>
                          {" "}
                          {order.package_name} for {order.user_full_name} ({" "}
                          {order.delivery_city}){" "}
                        </span>{" "}
                        <button
                          onClick={() =>
                            handleUnstageOrder(group.driverId, order.id)
                          }
                          disabled={
                            isLoading.confirming || isGeocodingInProgress
                          }
                          className="button button-unstage"
                        >
                          {" "}
                          Unstage{" "}
                        </button>{" "}
                      </li>
                    ))}{" "}
                  </ul>{" "}
                </div>
              ))}{" "}
              <button
                onClick={handleConfirmAllStagedAssignments}
                disabled={
                  isLoading.confirming ||
                  isLoading.staging ||
                  isGeocodingInProgress ||
                  Object.keys(stagedAssignments).length === 0
                }
                className="button button-confirm-all"
              >
                {" "}
                {isLoading.confirming
                  ? "Confirming..."
                  : "Confirm All Staged Assignments"}{" "}
              </button>{" "}
            </div>
          )}

          {/* --- CONFIRMED ASSIGNMENTS FOR THE DAY --- */}
          {/* ... (Your existing Confirmed Assignments section with its filter - no change) ... */}
          <div className="section-confirmed-assignments">
            {" "}
            <div className="confirmed-header-with-filter">
              {" "}
              <h2>
                {" "}
                Confirmed Assignments for {selectedDateString} ({" "}
                {filteredConfirmedAssignments.length}){" "}
              </h2>{" "}
              <div className="confirmed-assignments-filter">
                {" "}
                <label htmlFor="confirmedDriverFilter">
                  Filter by Driver:
                </label>{" "}
                <select
                  id="confirmedDriverFilter"
                  value={selectedDriverForConfirmed}
                  onChange={handleConfirmedDriverFilterChange}
                  disabled={isLoading.confirmed || activeDrivers.length === 0}
                >
                  {" "}
                  <option value="">All Assigned Drivers</option>{" "}
                  {activeDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {" "}
                      {driver.full_name}{" "}
                    </option>
                  ))}{" "}
                </select>{" "}
              </div>{" "}
            </div>{" "}
            {isLoading.confirmed && (
              <p className="loading-placeholder">
                {" "}
                Loading confirmed assignments...{" "}
              </p>
            )}{" "}
            {!isLoading.confirmed &&
              confirmedAssignmentsForDate.length === 0 && (
                <p>No deliveries confirmed for this date yet.</p>
              )}{" "}
            {!isLoading.confirmed &&
              confirmedAssignmentsForDate.length > 0 &&
              filteredConfirmedAssignments.length === 0 &&
              selectedDriverForConfirmed && (
                <p>
                  {" "}
                  No confirmed assignments for the selected driver on this date.{" "}
                </p>
              )}{" "}
            {filteredConfirmedAssignments.length > 0 && (
              <div className="table-wrapper">
                {" "}
                <table>
                  {" "}
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th>Customer</th>
                      <th>Package</th>
                      <th>Address</th>
                      <th>Status</th>
                      <th>Proof</th> {/* <<<< NEW COLUMN HEADER */}
                    </tr>
                  </thead>
                  <tbody>
                    {" "}
                    {filteredConfirmedAssignments.map((assignment) => (
                      <tr key={assignment.assignmentId}>
                        <td>{assignment.driverName || "N/A"}</td>
                        <td>{assignment.customerName || "N/A"}</td>
                        <td>{assignment.packageName || "N/A"}</td>
                        <td>{assignment.fullDeliveryAddress || "N/A"}</td>
                        <td>{assignment.status}</td>
                        <td>
                          {" "}
                          {/* <<<< NEW CELL FOR BUTTON */}
                          {assignment.status === "Delivered" &&
                          assignment.proof_of_delivery_url ? (
                            <button
                              className="button button-view-proof"
                              onClick={() => {
                                setProofingImageUrl(
                                  assignment.proof_of_delivery_url!
                                );
                                setIsProofModalOpen(true);
                              }}
                            >
                              View Proof
                            </button>
                          ) : assignment.status === "Delivered" ? (
                            <span className="text-muted-small">No Proof</span>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}{" "}
                  </tbody>{" "}
                </table>{" "}
              </div>
            )}{" "}
          </div>
        </>
      )}
      {isProofModalOpen && proofingImageUrl && (
        <div
          className="modal-overlay"
          onClick={() => setIsProofModalOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-button"
              onClick={() => setIsProofModalOpen(false)}
            >
              &times;
            </button>
            <h4>Proof of Delivery</h4>
            <img
              src={proofingImageUrl}
              alt="Proof of Delivery"
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                display: "block",
                margin: "auto",
                borderRadius: "4px",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignDeliveries;
