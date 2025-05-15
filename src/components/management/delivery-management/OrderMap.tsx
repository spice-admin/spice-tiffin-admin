// src/components/admin/OrderMap.tsx
import React, { useEffect, useRef, memo, useState, useMemo } from "react"; // Make sure useMemo is imported
import mapboxgl from "mapbox-gl";
import type { LngLatLike } from "mapbox-gl";
import type { DeliveryJob } from "../../../types/delivery.types";
import polylineUtil from "@mapbox/polyline";

import "./assign-deliveries.css";

// Define default values as stable constants OUTSIDE the component
const STABLE_DEFAULT_CENTER: [number, number] = [-79.3832, 43.6532];
const STABLE_DEFAULT_ZOOM = 9;

interface OrderMapProps {
  stops: DeliveryJob[];
  routePolyline?: string | null;
  startLocation?: {
    coordinates: [number, number];
    name?: string;
  };
  mapboxToken: string;
  defaultCenter?: [number, number]; // Prop is still optional
  defaultZoom?: number; // Prop is still optional
  mapIdSuffix?: string;
}

const OrderMap: React.FC<OrderMapProps> = ({
  stops,
  routePolyline,
  startLocation,
  mapboxToken,
  defaultCenter = STABLE_DEFAULT_CENTER, // Use the stable constant for default
  defaultZoom = STABLE_DEFAULT_ZOOM, // Use the stable constant for default
  mapIdSuffix = "",
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isMapStyleLoaded, setIsMapStyleLoaded] = useState(false);

  const ROUTE_SOURCE_ID = `optimized-route-source${mapIdSuffix}`;
  const ROUTE_LAYER_ID = `optimized-route-layer${mapIdSuffix}`;

  // Effect for map initialization
  useEffect(() => {
    if (!mapboxToken) {
      console.warn(
        `OrderMap [${mapIdSuffix}]: Mapbox token is missing. Map will not initialize.`
      );
      setIsMapStyleLoaded(false);
      return;
    }
    if (mapInstanceRef.current || !mapContainerRef.current) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    console.log(`OrderMap [${mapIdSuffix}]: Initializing map...`);

    let map = new mapboxgl.Map({
      // Renamed to 'map' locally for this scope
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: defaultCenter, // This 'defaultCenter' is now stable from props/defaults
      zoom: defaultZoom, // This 'defaultZoom' is now stable
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    map.on("load", () => {
      console.log(
        `OrderMap [${mapIdSuffix}]: Map style loaded ('load' event fired).`
      );
      setIsMapStyleLoaded(true);
    });

    map.on("error", (e) => {
      console.error(
        `OrderMap [${mapIdSuffix}]: A Mapbox GL error occurred:`,
        e.error?.message || e
      );
      setIsMapStyleLoaded(false);
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      console.log(`OrderMap [${mapIdSuffix}]: Cleaning up map instance.`);
      setIsMapStyleLoaded(false); // Reset the flag
      if (mapInstanceRef.current) {
        // Check ref before removing
        mapInstanceRef.current.remove();
      }
      mapInstanceRef.current = null;
    };
    // The dependencies: mapboxToken is primitive. defaultCenter & defaultZoom are now stable references
    // (either from the stable constants if not overridden by props, or if parent passes memoized versions).
    // mapIdSuffix is primitive.
  }, [mapboxToken, defaultCenter, defaultZoom, mapIdSuffix]);

  // Effect for updating markers and route line
  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map || !isMapStyleLoaded) {
      if (map && !isMapStyleLoaded) {
        // map exists but our flag isn't true yet
        console.log(
          `OrderMap [${mapIdSuffix}]: Waiting for 'isMapStyleLoaded' state (currently ${isMapStyleLoaded}).`
        );
      } else if (!map) {
        console.log(
          `OrderMap [${mapIdSuffix}]: Map instance not available yet for drawing.`
        );
      }
      return;
    }
    // Redundant check, but safe:
    if (!map.isStyleLoaded()) {
      console.log(
        `OrderMap [${mapIdSuffix}]: map.isStyleLoaded() is false, deferring draw operations.`
      );
      return;
    }

    console.log(
      `OrderMap [${mapIdSuffix}]: Map is loaded. Updating markers/route. Stops: ${
        stops.length
      }, Polyline: ${!!routePolyline}`
    );

    // ... (rest of the marker and polyline drawing logic - no changes here from last version) ...
    // 1. Clear existing markers & route
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID);
    if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);

    const allPointsForBounds: mapboxgl.LngLatLike[] = [];

    // 2. Add Start Marker
    if (startLocation?.coordinates) {
      const el = document.createElement("div");
      el.className = "map-marker start-marker";
      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#16a34a" width="30px" height="30px"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z"/></svg>`;
      markersRef.current.push(
        new mapboxgl.Marker(el)
          .setLngLat(startLocation.coordinates)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setText(
              startLocation.name || "Start"
            )
          )
          .addTo(map)
      );
      allPointsForBounds.push(startLocation.coordinates);
    }

    // 3. Add Stop Markers
    stops.forEach((stop, index) => {
      if (
        stop.coordinates &&
        typeof stop.coordinates[0] === "number" &&
        typeof stop.coordinates[1] === "number"
      ) {
        const el = document.createElement("div");
        el.className = "map-marker stop-marker";
        el.innerHTML = `<div class="marker-pin"><span>${
          index + 1
        }</span></div>`;
        markersRef.current.push(
          new mapboxgl.Marker(el)
            .setLngLat(stop.coordinates)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 }).setHTML(
                `<h4>${index + 1}. ${stop.package_name || "Delivery"}</h4>
                 <p><strong>To:</strong> ${stop.customer_name || "N/A"}</p>
                 <p><small>${
                   stop.full_delivery_address || "Address N/A"
                 }</small></p>`
              )
            )
            .addTo(map)
        );
        allPointsForBounds.push(stop.coordinates);
      } else {
        console.warn(
          `OrderMap [${mapIdSuffix}]: Invalid coordinates for stop id ${stop.id}`,
          stop.coordinates
        );
      }
    });

    // 4. Add Route Polyline
    if (routePolyline) {
      try {
        const decodedCoordinates = polylineUtil.decode(routePolyline);
        const geojsonCoordinates = decodedCoordinates.map((c) => [c[1], c[0]]);

        if (geojsonCoordinates.length > 0) {
          map.addSource(ROUTE_SOURCE_ID, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: geojsonCoordinates },
            },
          });
          map.addLayer({
            id: ROUTE_LAYER_ID,
            type: "line",
            source: ROUTE_SOURCE_ID,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#3b82f6",
              "line-width": 5,
              "line-opacity": 0.75,
            },
          });
        }
      } catch (e) {
        console.error(
          `OrderMap [${mapIdSuffix}]: Error processing or adding route polyline:`,
          e
        );
      }
    }

    // 5. Adjust map bounds
    if (allPointsForBounds.length > 0) {
      const bounds = allPointsForBounds.reduce(
        (b, coord) => b.extend(coord),
        new mapboxgl.LngLatBounds(allPointsForBounds[0], allPointsForBounds[0])
      );
      map.fitBounds(bounds, { padding: 80, maxZoom: 16, duration: 0 });
    } else if (stops.length === 0 && !routePolyline) {
      map.flyTo({ center: defaultCenter, zoom: defaultZoom, duration: 0 });
    }
  }, [
    stops,
    routePolyline,
    startLocation,
    isMapStyleLoaded,
    mapIdSuffix,
    defaultCenter,
    defaultZoom,
  ]);

  return <div ref={mapContainerRef} className="order-map-render-area" />;
};

export default memo(OrderMap);
