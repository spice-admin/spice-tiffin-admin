// src/types/index.ts

// --- Generic API Response ---
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  count?: number; // Added count for lists
  total?: number; // Added total for pagination later
  error?: any;
  errors?: any;
}

// Corresponds to PackageType enum on the backend
export enum PackageType {
  TRIAL = "trial",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
}

// Simplified Category interface for frontend use
export interface ICategoryFE {
  _id: string;
  name: string;
}

// Frontend representation of the Package data
export interface IPackageFE {
  _id: string; // Use _id from MongoDB
  name: string;
  description?: string;
  price: number;
  type: PackageType;
  days: number;
  category: ICategoryFE; // Use the populated category object
  image?: string;
  createdAt: string; // Dates are often strings after JSON serialization
  updatedAt: string;
}

// For creating/updating packages, category will be just the ID
export interface IPackageFormData {
  name: string;
  description?: string;
  price: number;
  type: PackageType;
  days: number;
  category: string; // Send ObjectId as string
  image?: string;
}

// --- Backend API Response Structure ---
// Assuming your controllers return data in this format

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: any; // Adjust based on actual error structure
}

// Define a type for customer data
export interface ICustomerFE {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  status: "Active" | "Inactive" | "Pending"; // Example statuses
  joinedDate: string; // Use string for simplicity, can be Date object if needed
}

export interface IPaymentFE {
  _id: string;
  customerName: string;
  customerEmail: string;
  packageName: string;
  amount: number;
  paymentMethod: "Stripe" | "PayPal" | "Bank Transfer" | "UPI"; // Example methods
  status: "Completed" | "Pending" | "Failed";
  transactionId?: string; // e.g., Stripe charge ID
  paymentDate: string; // ISO string format recommended
}

export type OrderStatus =
  | "Pending"
  | "Preparing"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export interface IOrderFE {
  _id: string;
  orderNumber: string; // User-friendly order identifier
  customerName: string;
  customerEmail: string;
  packageName: string;
  deliveryDate: string; // ISO string format recommended
  deliveryTimeSlot?: string; // e.g., "09:00 AM - 11:00 AM"
  status: OrderStatus;
  totalAmount: number;
  orderDate: string; // ISO string format recommended
}

export type DriverStatus = "Active" | "Inactive" | "On Delivery";

export interface IDriverFE {
  _id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  vehicleType: "Bike" | "Scooter" | "E-Bike"; // Example vehicle types
  vehicleNumber: string; // e.g., GJ01AB1234
  status: DriverStatus;
  assignedZone?: string; // e.g., "Zone A", "West"
  joinDate: string; // ISO string format recommended
}

export interface IOrderPackageInfo {
  _id: string;
  name: string;
  type: PackageType;
  // Add other fields if populated by backend (e.g., price, days)
}

// --- Basic Customer Info (Populated in Order) ---
export interface IOrderCustomerInfo {
  _id: string;
  fullName: string;
  email: string;
  mobile?: string | null; // Include mobile if populated
}
export interface IDeliveryAddressFE {
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  currentLocation?: string | null;
}

export interface IOrderAdminFE {
  _id: string;
  orderNumber: string;
  customer: IOrderCustomerInfo; // Populated customer info
  package: IOrderPackageInfo; // Populated package info
  packageName: string; // Denormalized
  packagePrice: number; // Denormalized
  deliveryDays: number; // Denormalized
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  status: OrderStatus;
  deliveryAddress: IDeliveryAddressFE; // Full address might be needed
  paymentDetails: PaymentDetailsBase; // Full payment details might be needed
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

/**
 * Represents a Customer as fetched for the Admin Panel list.
 * Includes fields relevant for admin view/management.
 */
export interface ICustomerAdminFE {
  _id: string;
  fullName: string;
  email: string;
  mobile: string;
  stripeCustomerId?: string | null;
  verification: boolean; // Include verification status
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  currentLocation?: string | null;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

// --- NEW: City Type for Admin Panel ---
/**
 * Represents a City as fetched/managed in the Admin Panel.
 * Mirrors the backend ICity model structure.
 */
export interface ICityAdminFE {
  _id: string;
  name: string;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

// Type for the Add/Edit City form data
export interface ICityFormData {
  name: string;
}

export interface IAdminCustomerPopulated {
  _id: string;
  fullName: string;
  email?: string; // Make optional if not always selected/present
  phone?: string; // Make optional
  address?: {
    // Make address object optional if customer might not have one
    address?: string;
    city?: string;
    postalCode?: string;
    // Add other address fields if populated by the backend
  };
  // Add other customer fields if needed
}

// Interface for the populated package data in admin order view
export interface IAdminPackagePopulated {
  _id: string;
  name: string;
  type?: string; // Make optional if not always selected/present
  duration?: number; // Make optional
  // Add other package fields if needed
}

// Interface for the Order data specific to the admin's active orders view
export interface IAdminOrderFE {
  _id: string;
  orderNumber: string;
  customer: IAdminCustomerPopulated | null; // Can be null if population fails
  package: IAdminPackagePopulated | null; // Can be null if population fails
  startDate: string; // Dates will likely be strings from JSON
  endDate: string;
  status: "Active" | "Expired" | "Cancelled"; // Use the enum values
  deliveryAddress: {
    // Use the structure defined in the Order model
    address?: string;
    city?: string;
    postalCode?: string;
    currentLocation?: string;
  };
  createdAt: string;
  updatedAt: string;
  // Add other fields if needed
}

// Interface for the API response structure
export interface IAdminGetActiveOrdersResponse {
  success: boolean;
  message: string;
  count: number;
  data: IAdminOrderFE[];
}

// Interface for Driver data returned by the API (password excluded)
export interface IDriverFE {
  _id: string;
  fullName: string;
  phone: string;
  vehicleNumber: string;
  status: DriverStatus;
  createdAt: string; // Dates from JSON are strings
  updatedAt: string;
  // Add other fields if returned by API and needed by frontend
}

// Interface for the data required by the Add/Edit Driver form
export interface IDriverFormData {
  fullName: string;
  phone: string;
  vehicleNumber: string;
  password?: string; // Password is required on create, optional on update
  status: "Active" | "Inactive";
}

// Interfaces for API responses (optional but good practice)
export interface IDriverApiResponse {
  success: boolean;
  message: string;
  data: IDriverFE | null;
}

export interface IGetAllDriversApiResponse {
  success: boolean;
  message: string;
  count?: number; // Include count if backend provides it
  data: IDriverFE[];
}
