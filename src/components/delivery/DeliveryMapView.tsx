// src/components/delivery/DeliveryMapView.tsx

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet"; // Import Leaflet type
import "leaflet/dist/leaflet.css"; // Import Leaflet CSS
import type { IOrderAdminFE } from "../../types"; // Adjust path

// --- Leaflet Icon Fix (Important!) ---
// Default Leaflet icons might not load correctly with bundlers.
// This workaround re-imports them. Place this code *outside* the component.
import L from "leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Delete the default icon setup and re-apply it
// @ts-ignore Property '_getIconUrl' does not exist on type 'IconOptions'.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetinaUrl.src, // Use .src if using bundler imports
  iconUrl: iconUrl.src,
  shadowUrl: shadowUrl.src,
});
// --- End Leaflet Icon Fix ---

interface DeliveryMapViewProps {
  assignedOrders: IOrderAdminFE[];
  isLoading: boolean;
  // Add center/zoom props later if needed for more control
}

// Helper component to recenter map when orders change
const RecenterMap = ({
  center,
  zoom,
}: {
  center: LatLngExpression;
  zoom: number;
}) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const DeliveryMapView: React.FC<DeliveryMapViewProps> = ({
  assignedOrders,
  isLoading,
}) => {
  // Default map center (e.g., your city or service area) - Adjust as needed
  const defaultCenter: LatLngExpression = [43.6532, -79.3832]; // Toronto example
  const defaultZoom = 11;

  // Calculate bounds or center based on assigned orders
  const getMapBounds = (): LatLngExpression[] | null => {
    const validCoords = assignedOrders
      .map((order) => order.deliveryAddress)
      .filter(
        (addr) =>
          typeof addr?.latitude === "number" &&
          typeof addr?.longitude === "number"
      )
      .map((addr) => [addr!.latitude!, addr!.longitude!] as LatLngExpression); // Assert non-null

    return validCoords.length > 0 ? validCoords : null;
  };

  const bounds = getMapBounds();
  // Determine center/zoom: if bounds exist, Leaflet can fitBounds. If not, use default.
  const mapCenter = bounds && bounds.length > 0 ? bounds[0] : defaultCenter; // Fallback center if needed
  const mapZoom = bounds && bounds.length > 0 ? defaultZoom : 10; // Adjust zoom logic if needed

  return (
    <div className="card mb-3">
      {" "}
      {/* Wrap map in a card */}
      <div className="card-body p-0">
        {" "}
        {/* Remove padding if map fills card */}
        <div className="map-container">
          {" "}
          {/* Ensure this class has height/width */}
          {isLoading && (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading map data...</span>
              </div>
            </div>
          )}
          {!isLoading && (
            <MapContainer
              center={mapCenter} // Initial center
              zoom={mapZoom} // Initial zoom
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              {/* Recenter map when bounds change */}
              {bounds && bounds.length > 0 && (
                <RecenterMap center={bounds[0]} zoom={defaultZoom} />
              )}
              {/* Use fitBounds if preferred (might need a different component structure) */}
              {/* {bounds && bounds.length > 0 && <FitBounds bounds={bounds} />} */}

              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {assignedOrders
                .filter(
                  (
                    order // Ensure coordinates are valid numbers
                  ) =>
                    typeof order.deliveryAddress?.latitude === "number" &&
                    typeof order.deliveryAddress?.longitude === "number"
                )
                .map((order) => (
                  <Marker
                    key={order._id}
                    position={[
                      order.deliveryAddress.latitude!,
                      order.deliveryAddress.longitude!,
                    ]} // Assert non-null
                  >
                    <Popup>
                      <b>Order #{order.orderNumber}</b>
                      <br />
                      Customer: {order.customer?.fullName || "N/A"}
                      <br />
                      Package: {order.package?.name || "N/A"}
                      <br />
                      Address: {order.deliveryAddress?.address || "N/A"}
                      {/* Optional: Add sequence number */}
                      {typeof order.deliverySequence === "number" && (
                        <>
                          <br />
                          Sequence: {order.deliverySequence}
                        </>
                      )}
                    </Popup>
                  </Marker>
                ))}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryMapView;
