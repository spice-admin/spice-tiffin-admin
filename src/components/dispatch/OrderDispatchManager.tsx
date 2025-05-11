// src/components/dispatch/OrderDispatchManager.tsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  type IAdminOrder,
  AdminOrderStatus,
  type Category as ICity,
} from "../../types";
import mapboxgl from "mapbox-gl";
import { format as formatDateFns } from "date-fns";
// import { HiOutlineLocationMarker, HiOutlineXMark, HiOutlineEye } from "react-icons/hi2";
import OrderDetailModal from "../management/OrderDetailModal";

const MAPBOX_TOKEN = import.meta.env.PUBLIC_MAPBOX_ACCESS_TOKEN;

interface IOrderWithCoords extends IAdminOrder {
  latitude?: number;
  longitude?: number;
}

declare global {
  interface Window {
    handleOpenOrderDetailsFromMap: (orderId: string) => void;
  }
}

const OrderDispatchManager: React.FC = () => {
  const [cities, setCities] = useState<ICity[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [orders, setOrders] = useState<IOrderWithCoords[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [initialViewport, setInitialViewport] = useState({
    latitude: 43.752819,
    longitude: -79.254298,
    zoom: 19,
  });

  const [orderDetailModalOpen, setOrderDetailModalOpen] =
    useState<boolean>(false);
  const [orderForModal, setOrderForModal] = useState<IAdminOrder | null>(null);

  const fetchCities = useCallback(async () => {
    const { data, error: cityError } = await supabase
      .from("cities")
      .select("id, name")
      .order("name");
    if (cityError) console.error("Error fetching cities:", cityError);
    else if (data) setCities(data as ICity[]);
  }, []);

  const fetchOrdersForCity = useCallback(async (city: string) => {
    if (!city) {
      setOrders([]);
      return;
    }
    setIsLoading(true);
    setError(null);

    const today = formatDateFns(new Date(), "yyyy-MM-dd");

    try {
      const { data, error: fetchError } = await supabase
        .from("orders")
        .select(
          `
          id, user_full_name, package_name, order_status, 
          delivery_address, delivery_city, delivery_postal_code, 
          delivery_latitude, delivery_longitude, 
          delivery_start_date, delivery_end_date, package_price, user_email, user_phone,
          package_type, package_days, stripe_payment_id, stripe_customer_id, order_date, created_at, updated_at
        `
        ) // CORRECTED: Comment removed from this string
        .eq("delivery_city", city)
        .in("order_status", [
          AdminOrderStatus.CONFIRMED,
          AdminOrderStatus.PROCESSING,
        ]) // Ensure AdminOrderStatus is correctly used
        .gte("delivery_end_date", today)
        .order("delivery_start_date", { ascending: true });

      if (fetchError) throw fetchError;

      const ordersWithCoords: IOrderWithCoords[] = (data || []).map((order) => {
        return {
          ...order,
          latitude: order.delivery_latitude,
          longitude: order.delivery_longitude,
        };
      });
      setOrders(ordersWithCoords);

      const firstOrderWithCoords = ordersWithCoords.find(
        (o) => o.latitude && o.longitude
      );
      if (firstOrderWithCoords && mapRef.current) {
        mapRef.current.flyTo({
          center: [
            firstOrderWithCoords.longitude!,
            firstOrderWithCoords.latitude!,
          ],
          zoom: 11,
        });
      } else if (data && data.length > 0 && mapRef.current) {
        console.warn(
          `No orders with coordinates found for ${city}. Map will not auto-center on orders. Consider geocoding the city name.`
        );
      }
    } catch (err) {
      console.error(
        `[OrderDispatchManager] Error fetching orders for city ${city}:`,
        err
      );
      setError((err as Error).message);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);
  useEffect(() => {
    if (selectedCity) fetchOrdersForCity(selectedCity);
    else setOrders([]);
  }, [selectedCity, fetchOrdersForCity]);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setSelectedCity(e.target.value);
  const handleOpenOrderDetails = (order: IOrderWithCoords | IAdminOrder) => {
    setOrderForModal(order as IAdminOrder);
    setOrderDetailModalOpen(true);
  };
  const handleCloseModal = () => {
    setOrderDetailModalOpen(false);
    setOrderForModal(null);
  };

  useEffect(() => {
    window.handleOpenOrderDetailsFromMap = (orderId: string) => {
      const orderToView = orders.find((o) => o.id === orderId);
      if (orderToView) {
        handleOpenOrderDetails(orderToView);
      }
    };
    return () => {
      delete window.handleOpenOrderDetailsFromMap;
    };
  }, [orders]);

  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      setError("Mapbox token not configured. Map cannot be displayed.");
      console.error("Mapbox token not configured.");
      return;
    }
    if (mapRef.current || !mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [initialViewport.longitude, initialViewport.latitude],
      zoom: initialViewport.zoom,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-left");
    mapRef.current.addControl(new mapboxgl.FullscreenControl(), "top-left");
    mapRef.current.addControl(
      new mapboxgl.GeolocateControl({ trackUserLocation: true }),
      "top-left"
    );
    mapRef.current.addControl(new mapboxgl.ScaleControl());

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [initialViewport]);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    orders.forEach((order) => {
      if (order.latitude && order.longitude) {
        const el = document.createElement("div");
        el.className = "custom-marker";
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red" width="30px" height="30px"><path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" /></svg>`;
        el.style.cursor = "pointer";

        const marker = new mapboxgl.Marker(el)
          .setLngLat([order.longitude, order.latitude] as mapboxgl.LngLatLike)
          .addTo(mapRef.current!);

        const popupContent = `
          <div>
            <strong>Order ID:</strong> ${order.id.substring(0, 8)}...<br/>
            <strong>Customer:</strong> ${order.user_full_name || "N/A"}<br/>
            <strong>Package:</strong> ${order.package_name || "N/A"}<br/>
            <strong>Status:</strong> ${order.order_status}<br/>
            <button 
              class="btn btn-sm btn-link p-0 mt-1" 
              onclick="window.handleOpenOrderDetailsFromMap('${order.id}')"
            >
              View Full Details
            </button>
          </div>
        `;

        const popup = new mapboxgl.Popup({
          offset: 35,
          closeButton: true,
          closeOnClick: true,
        }).setHTML(popupContent);

        marker.setPopup(popup);
        markersRef.current.push(marker);
      }
    });
  }, [orders, mapRef]);

  return (
    <div
      className="dispatch-manager"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 150px)",
      }}
    >
      <div className="dispatch-controls card mb-3">
        {/* ... your city filter select ... */}
        <div className="card-body">
          <h5 className="card-title">Filter Orders for Dispatch</h5>
          <div className="row">
            <div className="col-md-4">
              <label htmlFor="cityFilter" className="form-label">
                Select City:
              </label>
              <select
                id="cityFilter"
                className="form-select"
                value={selectedCity}
                onChange={handleCityChange}
              >
                <option value="">-- Select a City --</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="text-center p-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading orders...</span>
          </div>
        </div>
      )}
      {error && <div className="alert alert-danger text-center">{error}</div>}

      <div
        className="map-container card"
        style={{ flexGrow: 1, minHeight: "400px", position: "relative" }}
      >
        {MAPBOX_TOKEN ? (
          <div
            ref={mapContainerRef}
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <div className="alert alert-warning text-center">
            Mapbox token not configured. Map cannot be displayed.
          </div>
        )}
      </div>

      <OrderDetailModal
        isOpen={orderDetailModalOpen}
        onClose={handleCloseModal}
        order={orderForModal}
      />
    </div>
  );
};

export default OrderDispatchManager;
