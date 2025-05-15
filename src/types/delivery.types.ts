// src/types/delivery.types.ts

// For an Order fetched from the 'orders' table to be displayed for assignment
export interface OrderForAssignment {
  id: string; // from orders table
  user_full_name: string | null;
  user_phone: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_postal_code: string | null;
  package_name: string | null;
  delivery_start_date: string | null; // ISO date string
  delivery_end_date: string | null; // ISO date string
  // Add any other fields from 'orders' you want to display or use in logic
  // e.g., user_phone, delivery_notes, etc.
}

// For a Driver fetched from the 'drivers' table
export interface Driver {
  id: string; // user_id from auth.users (or your drivers table PK)
  full_name: string | null;
  phone?: string | null;
  is_active: boolean;
}

// For a City fetched from the 'cities' table
export interface City {
  id: string;
  name: string;
}

// For the 'delivery_schedule' table entry
export interface DeliveryScheduleEntry {
  event_date: string; // DATE string (YYYY-MM-DD)
  is_delivery_enabled: boolean;
  notes?: string | null;
}

// For an item being staged for assignment in the UI (before confirmation)
// This will be grouped by driver
export interface StagedAssignmentGroup {
  driverId: string;
  driverName: string | null;
  orders: OrderForAssignment[]; // The full order objects being staged for this driver
}

// For displaying an already confirmed assignment from 'driver_assignments' table
export interface ConfirmedAssignmentDisplay {
  assignmentId: string; // id from driver_assignments
  orderId: string;
  driverId: string | null; // Can be null if driver was deleted
  driverName: string | null; // Denormalized driver name
  assignedDate: string; // DATE string (YYYY-MM-DD)
  status: string; // 'Pending', 'Delivered', etc.
  customerName: string | null;
  fullDeliveryAddress: string | null;
  packageName: string | null;
  proof_of_delivery_url?: string | null;
}

// For creating a new record in the 'driver_assignments' Supabase table
export interface DriverAssignmentDBRecord {
  order_id: string;
  driver_id: string;
  assigned_date: string; // DATE string (YYYY-MM-DD)
  status:
    | "Pending"
    | "Out for Delivery"
    | "Delivered"
    | "Failed"
    | "Rescheduled"; // Enforce specific statuses
  assigned_by?: string; // UUID of admin user, optional

  // Denormalized fields (match your DB table structure from Phase 1)
  driver_name?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  full_delivery_address?: string | null;
  delivery_city?: string | null;
  package_name?: string | null;
  // delivery_notes?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  } | null;
  message?: string; // Optional general message
}

export interface DeliveryJob {
  id: string; // Unique identifier for this job (e.g., your daily_assignment_id from driver_assignments table)
  coordinates: [number, number]; // [longitude, latitude]

  // Denormalized fields from the order/assignment for easy access
  order_id: string;
  customer_name: string | null;
  full_delivery_address: string | null;
  package_name: string | null;
  user_phone?: string | null;
  delivery_city?: string | null;
  // Add any other details you included in the optimized_order_sequence objects
}

// Output type structure expected from our optimizeRouteWithMapbox service function
export interface OptimizedRouteResult {
  orderedJobs: DeliveryJob[]; // The input jobs, but now in optimized sequence
  routeGeometry: string; // Encoded polyline for drawing on map
  totalDurationSeconds: number;
  totalDistanceMeters: number;
}
