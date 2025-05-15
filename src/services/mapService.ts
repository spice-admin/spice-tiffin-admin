// src/services/mapService.ts

import type {
  DeliveryJob,
  OptimizedRouteResult,
} from "../types/delivery.types"; // Adjust path if necessary

// Interface for Geocoding Result (used by geocodeAddress)
interface GeocodeResult {
  latitude: number;
  longitude: number;
}

const MAPBOX_ACCESS_TOKEN = import.meta.env.PUBLIC_MAPBOX_ACCESS_TOKEN;
const LOCATIONIQ_ACCESS_TOKEN = import.meta.env.PUBLIC_LOCATIONIQ_ACCESS_TOKEN;

/**
 * Geocodes an address string using the Mapbox Geocoding API.
 */
export const geocodeAddress = async (
  fullAddress: string,
  provider: string = "mapbox"
): Promise<GeocodeResult | null> => {
  if (provider === "mapbox" && !MAPBOX_ACCESS_TOKEN) {
    console.error(
      "Mapbox Access Token (PUBLIC_MAPBOX_ACCESS_TOKEN) is not configured for geocoding."
    );
    // Note: User-facing alerts are generally better handled in the UI component
    // that calls this service, based on the null/error returned.
    return null;
  }
  // TODO: Add similar check if you implement LocationIQ geocoding and provider === "locationiq"

  if (!fullAddress || fullAddress.trim() === "") {
    console.warn("geocodeAddress: Address string is empty.");
    return null;
  }

  // Using Mapbox for geocoding as per current setup
  if (provider === "mapbox") {
    const proximityLng = -79.3832; // Toronto
    const proximityLat = 43.6532;
    const country = "CA"; // For Canadian addresses
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      fullAddress
    )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=${country}&proximity=${proximityLng},${proximityLat}&limit=1`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        // Try to parse error from Mapbox if possible
        let errorDetails = response.statusText;
        try {
          const errorData = await response.json();
          errorDetails = errorData.message || errorDetails;
        } catch (_) {
          /* ignore parsing error */
        }
        console.error(
          `Mapbox Geocoding API error for "${fullAddress}": ${response.status} ${errorDetails}`
        );
        return null; // Indicate failure
      }
      const data = await response.json();
      if (data && data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        return { latitude, longitude };
      } else {
        console.warn(
          `Geocoding failed (Mapbox) for address: "${fullAddress}". No features found.`
        );
        return null;
      }
    } catch (error) {
      console.error(
        `Exception during Mapbox geocoding for "${fullAddress}":`,
        error
      );
      return null;
    }
  }

  // Placeholder for other providers or if provider is not mapbox
  console.warn(
    `Geocoding provider "${provider}" not implemented or no token for it.`
  );
  return null;
};

// --- ROUTE OPTIMIZATION USING LOCATIONIQ ---

// Minimal types for LocationIQ API response structure for better clarity
interface LocationIQWaypoint {
  waypoint_index: number;
  trips_index: number; // This is often 0 for single trip responses
  location: [number, number]; // [longitude, latitude]
  name?: string;
  hint?: string;
  distance?: number; // Distance from the start of the trip to this waypoint along the path
}

interface LocationIQTrip {
  legs: any[];
  weight_name: string;
  geometry: string;
  weight: number;
  distance: number;
  duration: number;
}

interface LocationIQOptimizeResponse {
  code: string;
  waypoints?: LocationIQWaypoint[]; // Mark as optional
  trips?: LocationIQTrip[]; // Mark as optional
  message?: string;
}

/**
 * Optimizes a route for a single driver using LocationIQ Optimize API.
 * @param startCoords The starting coordinates [longitude, latitude].
 * @param deliveryJobs An array of DeliveryJob objects representing the stops.
 * @returns A promise that resolves to OptimizedRouteResult or throws an error.
 */
export const optimizeRouteWithLocationIQ = async (
  startCoords: [number, number],
  deliveryJobs: DeliveryJob[]
): Promise<OptimizedRouteResult> => {
  if (!LOCATIONIQ_ACCESS_TOKEN) {
    console.error(
      "LocationIQ Access Token (PUBLIC_LOCATIONIQ_ACCESS_TOKEN) is not configured."
    );
    throw new Error(
      "Route optimization service (LocationIQ) is not configured."
    );
  }
  if (!deliveryJobs || deliveryJobs.length === 0) {
    console.warn(
      "No delivery jobs provided for LocationIQ route optimization."
    );
    throw new Error("No deliveries to optimize.");
  }

  const coordinatesString = [
    `${startCoords[0]},${startCoords[1]}`,
    ...deliveryJobs.map(
      (job: DeliveryJob) => `${job.coordinates[0]},${job.coordinates[1]}`
    ),
  ].join(";");

  const params = new URLSearchParams({
    key: LOCATIONIQ_ACCESS_TOKEN,
    roundtrip: "false",
    source: "first",
    destination: "last",
    steps: "false",
    geometries: "polyline6",
    overview: "full",
    annotations: "false",
  });

  const url = `https://us1.locationiq.com/v1/optimize/driving/${coordinatesString}?${params.toString()}`;

  try {
    console.log("Sending request to LocationIQ Optimize API:", url);
    const response = await fetch(url);
    const data: LocationIQOptimizeResponse = await response.json();

    console.log("LocationIQ Optimize API Response:", data);

    if (data.code !== "Ok" || !data.trips || data.trips.length === 0) {
      console.error(
        "LocationIQ Optimization API Error:",
        data.message || data.code || `HTTP ${response.status}`
      );
      throw new Error(
        data.message ||
          data.code ||
          `LocationIQ API request failed with status ${response.status}`
      );
    }

    const trip = data.trips[0];

    // **** FIX FOR ERROR 1 & 2 ****
    if (!data.waypoints || data.waypoints.length !== deliveryJobs.length + 1) {
      console.error(
        "LocationIQ API: Waypoints array is missing or count mismatch. Expected:",
        deliveryJobs.length + 1,
        "Got:",
        data.waypoints?.length
      );
      throw new Error(
        "Waypoint data mismatch or missing in LocationIQ API response."
      );
    }

    const finalOrderedJobs: DeliveryJob[] = new Array(deliveryJobs.length);
    let validJobsCount = 0;

    // Explicitly type 'waypoint'
    for (let i = 1; i < data.waypoints.length; i++) {
      const waypoint: LocationIQWaypoint = data.waypoints[i]; // Explicit type
      const originalJobInputIndex = i - 1;
      const optimizedDeliveryJobIndex = waypoint.waypoint_index - 1;

      if (
        optimizedDeliveryJobIndex >= 0 &&
        optimizedDeliveryJobIndex < deliveryJobs.length &&
        deliveryJobs[originalJobInputIndex]
      ) {
        finalOrderedJobs[optimizedDeliveryJobIndex] =
          deliveryJobs[originalJobInputIndex];
        validJobsCount++;
      } else {
        console.warn(
          `Invalid waypoint_index (${waypoint.waypoint_index}) or original job missing for input index ${originalJobInputIndex}. Waypoint data:`,
          waypoint
        );
      }
    }

    const successfullyMappedJobs = finalOrderedJobs.filter(
      (job): job is DeliveryJob => !!job
    ); // Type guard

    if (successfullyMappedJobs.length !== deliveryJobs.length) {
      console.warn(
        `Could not map all jobs to optimized sequence. Expected ${deliveryJobs.length}, successfully mapped ${successfullyMappedJobs.length}. This may indicate an issue with API response or mapping logic.`
      );
      if (successfullyMappedJobs.length === 0 && deliveryJobs.length > 0) {
        throw new Error(
          "Failed to map any jobs to the optimized sequence from LocationIQ response."
        );
      }
    }

    return {
      orderedJobs: successfullyMappedJobs,
      routeGeometry: trip.geometry,
      totalDurationSeconds: Math.round(trip.duration || 0),
      totalDistanceMeters: Math.round(trip.distance || 0),
    };
  } catch (error) {
    console.error(
      "Exception during route optimization with LocationIQ:",
      error
    );
    throw error;
  }
};
