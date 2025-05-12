import React, { useEffect, useState, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { supabase } from "@lib/supabaseClient";
import "./optimized-routes.css";

interface Driver {
  id: string;
  full_name: string;
}

interface Order {
  id: string;
  user_full_name: string;
  delivery_address: string;
  delivery_city: string;
  delivery_postal_code: string;
  delivery_latitude: number;
  delivery_longitude: number;
}

const MAPBOX_TOKEN = import.meta.env.PUBLIC_MAPBOX_ACCESS_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN;

const START_LOCATION = {
  longitude: -79.248,
  latitude: 43.731,
  address: "817 Brimley Rd, Scarborough, ON M1J 1C9",
};

const OptimizedRoutesComp: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [optimizedOrders, setOptimizedOrders] = useState<Order[]>([]);
  const [routeStatus, setRouteStatus] = useState<string>("");
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

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
   * Fetch Optimized Routes
   */
  const fetchOptimizedRoutes = async (driverId: string) => {
    try {
      const currentDate = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("optimized_routes")
        .select("optimized_order, status")
        .eq("driver_id", driverId)
        .eq("delivery_date", currentDate);

      if (error) throw error;

      if (data.length === 0) {
        setOptimizedOrders([]);
        setRouteStatus("");
        updateMap([]);
        return;
      }

      const { optimized_order, status } = data[0];
      setRouteStatus(status);

      if (optimized_order.length > 0) {
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select(
            "id, user_full_name, delivery_address, delivery_city, delivery_postal_code, delivery_latitude, delivery_longitude"
          )
          .in("id", optimized_order);

        if (ordersError) throw ordersError;

        // Sort orders based on optimized_order sequence
        const sortedOrders = optimized_order
          .map((orderId: string) =>
            orders.find((order) => order.id === orderId)
          )
          .filter(Boolean);

        setOptimizedOrders(sortedOrders);
        updateMap(sortedOrders);
      }
    } catch (err) {
      console.error("Error fetching optimized routes:", err);
    }
  };

  /**
   * Update Map with Optimized Route
   */
  const updateMap = (orders: Order[]) => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Clear previous markers and route
    map.getSource("route") &&
      (map.getSource("route") as mapboxgl.GeoJSONSource).setData({
        type: "FeatureCollection",
        features: [],
      });

    // Remove all previous markers
    mapRef.current.getStyle().layers?.forEach((layer) => {
      if (layer.id.startsWith("marker-")) {
        map.removeLayer(layer.id);
        map.removeSource(layer.id);
      }
    });

    if (orders.length === 0) return;

    const coordinates = [
      [START_LOCATION.longitude, START_LOCATION.latitude],
      ...orders.map((order) => [
        order.delivery_longitude,
        order.delivery_latitude,
      ]),
    ];

    const routeGeoJSON = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates,
      },
    };

    // Update Route Source
    const routeSource = map.getSource("route");
    if (routeSource && "setData" in routeSource) {
      (routeSource as mapboxgl.GeoJSONSource).setData(routeGeoJSON);
    }

    // Add Markers
    orders.forEach((order, index) => {
      new mapboxgl.Marker({ color: "#FF5733" })
        .setLngLat([order.delivery_longitude, order.delivery_latitude])
        .setPopup(
          new mapboxgl.Popup().setText(`${index + 1}. ${order.user_full_name}`)
        )
        .addTo(map);
    });

    // Fit to Bounds
    const bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
    coordinates.forEach((coord) => bounds.extend(coord as [number, number]));
    map.fitBounds(bounds, { padding: 50 });
  };

  /**
   * Initialize Map
   */
  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [START_LOCATION.longitude, START_LOCATION.latitude],
      zoom: 12,
    });

    map.on("load", () => {
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3498db",
          "line-width": 4,
        },
      });
    });

    mapRef.current = map;
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, []);

  return (
    <div className="optimized-routes-wrapper">
      <h2>Optimized Routes</h2>

      <div className="driver-selection">
        <label htmlFor="driverSelect">Select Driver:</label>
        <select
          id="driverSelect"
          value={selectedDriver}
          onChange={(e) => {
            const driverId = e.target.value;
            setSelectedDriver(driverId);
            fetchOptimizedRoutes(driverId);
          }}
        >
          <option value="">-- Select Driver --</option>
          {drivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.full_name}
            </option>
          ))}
        </select>
      </div>

      <div className="map-container" ref={mapContainerRef} />

      <div className="orders-table">
        {optimizedOrders.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Customer Name</th>
                <th>Address</th>
                <th>City</th>
                <th>Postal Code</th>
              </tr>
            </thead>
            <tbody>
              {optimizedOrders.map((order, index) => (
                <tr key={order.id}>
                  <td>{index + 1}</td>
                  <td>{order.user_full_name}</td>
                  <td>{order.delivery_address}</td>
                  <td>{order.delivery_city}</td>
                  <td>{order.delivery_postal_code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No deliveries for the selected driver.</p>
        )}
      </div>
    </div>
  );
};

export default OptimizedRoutesComp;
