import React, { useEffect, useState } from "react";
import { supabase } from "@lib/supabaseClient";
import "./route-optimization.css";

interface Driver {
  id: string;
  full_name: string;
}

interface AssignedDelivery {
  id: string;
  user_full_name: string;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
}

const START_LOCATION = {
  latitude: 43.731,
  longitude: -79.248,
  address: "817 Brimley Rd, Scarborough, ON M1J 1C9",
};

const MAPBOX_TOKEN = import.meta.env.PUBLIC_MAPBOX_ACCESS_TOKEN;

const RouteOptimizationComp: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [assignedOrders, setAssignedOrders] = useState<AssignedDelivery[]>([]);

  /**
   * Fetch Drivers
   */
  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from("drivers")
        .select("id, full_name")
        .eq("is_active", true);

      if (error) throw error;
      setDrivers(data || []);
    } catch (err) {
      console.error("Error fetching drivers:", err);
    }
  };

  /**
   * Fetch Assigned Deliveries for Selected Driver (Today's Date Only)
   */
  const fetchAssignedOrders = async (driverId: string) => {
    try {
      const currentDate = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("assigned_deliveries")
        .select("order_ids")
        .eq("driver_id", driverId)
        .eq("delivery_date", currentDate);

      if (error) throw error;

      if (data.length === 0) {
        setAssignedOrders([]);
        return;
      }

      const orderIds = data[0].order_ids;

      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(
          "id, user_full_name, delivery_address, delivery_latitude, delivery_longitude"
        )
        .in("id", orderIds);

      if (ordersError) throw ordersError;

      setAssignedOrders(orders || []);
    } catch (err) {
      console.error("Error fetching assigned orders:", err);
    }
  };

  /**
   * Handle Driver Selection
   */
  const handleDriverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setSelectedDriver(selectedId);
    if (selectedId) fetchAssignedOrders(selectedId);
  };

  /**
   * Calculate the distance between two coordinates
   */
  const isWithinTolerance = (
    coord1: number[],
    coord2: number[],
    tolerance = 0.001
  ) => {
    return (
      Math.abs(coord1[0] - coord2[0]) <= tolerance &&
      Math.abs(coord1[1] - coord2[1]) <= tolerance
    );
  };

  /**
   * Optimize Routes Using Mapbox API
   */
  const handleOptimizeRoutes = async () => {
    if (!selectedDriver || assignedOrders.length === 0) {
      alert("No orders to optimize.");
      return;
    }

    // Construct waypoints
    const waypoints = [
      `${START_LOCATION.longitude},${START_LOCATION.latitude}`,
      ...assignedOrders.map(
        (order) => `${order.delivery_longitude},${order.delivery_latitude}`
      ),
    ];

    const optimizationUrl = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${waypoints.join(
      ";"
    )}?access_token=${MAPBOX_TOKEN}`;

    try {
      const response = await fetch(optimizationUrl);
      const data = await response.json();

      console.log("Mapbox Optimization Response:", data);

      if (data.code !== "Ok") {
        console.error("Optimization error:", data.message);
        alert("Route optimization failed.");
        return;
      }

      const optimizedOrderIds = data.waypoints
        .slice(1) // Exclude the starting point
        .sort((a, b) => a.waypoint_index - b.waypoint_index)
        .map((waypoint) => {
          const waypointLocation = waypoint.location;

          console.log("Waypoint Location:", waypointLocation);

          const matchingOrder = assignedOrders.find((order) => {
            const isMatch = isWithinTolerance(
              [order.delivery_longitude, order.delivery_latitude],
              waypointLocation
            );

            console.log(
              `Checking Order ID: ${order.id} | Order Location: [${order.delivery_longitude}, ${order.delivery_latitude}] | Match: ${isMatch}`
            );

            return isMatch;
          });

          if (!matchingOrder) {
            console.warn(
              `No match found for waypoint location: ${waypointLocation[0]}, ${waypointLocation[1]}`
            );
          }

          return matchingOrder?.id;
        })
        .filter(Boolean);

      console.log(
        "Optimized Order IDs after tolerance adjustment:",
        optimizedOrderIds
      );

      const currentDate = new Date().toISOString().split("T")[0];

      const { error } = await supabase.from("optimized_routes").insert({
        driver_id: selectedDriver,
        delivery_date: currentDate,
        optimized_order: optimizedOrderIds,
        status: "Pending",
      });

      if (error) throw error;

      alert(
        "Routes have been optimized. Please visit the optimized routes page."
      );
    } catch (err) {
      console.error("Error optimizing routes:", err);
      alert("Error optimizing routes.");
    }
  };

  /**
   * Fetch Drivers on Mount
   */
  useEffect(() => {
    fetchDrivers();
  }, []);

  return (
    <div className="route-optimization-wrapper">
      <h2>Route Optimization</h2>

      <div className="driver-selection">
        <label htmlFor="driverSelect">Select Driver:</label>
        <select
          id="driverSelect"
          value={selectedDriver}
          onChange={handleDriverChange}
        >
          <option value="">-- Select Driver --</option>
          {drivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.full_name}
            </option>
          ))}
        </select>
      </div>

      {assignedOrders.length > 0 && (
        <>
          <table className="assigned-orders-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer Name</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {assignedOrders.map((order, index) => (
                <tr key={order.id}>
                  <td>{index + 1}</td>
                  <td>{order.user_full_name}</td>
                  <td>{order.delivery_address}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="optimize-btn" onClick={handleOptimizeRoutes}>
            Optimize Routes
          </button>
        </>
      )}
    </div>
  );
};

export default RouteOptimizationComp;
