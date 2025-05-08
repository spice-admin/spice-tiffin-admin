// src/types/index.ts

// --- Generic API Response ---
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T; // Specific data payload
  count?: number; // Count for current page list
  total?: number; // Total items for pagination
  pagination?: IPaginationData; // Nested pagination data
  errors?: any; // For validation errors (e.g., Zod)
  error?: any; // For general errors
  // Specific flags/tokens used by certain auth responses
  verificationRequired?: boolean;
  token?: string; // Login JWT
  resetToken?: string; // Password reset token
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

export interface CartItem {
  addonId: string;
  name: string;
  price: number; // Price per unit (dollars)
  image: string;
  quantity: number;
}

export interface IAddonFE {
  _id: string;
  name: string;
  price: number; // Assume dollars for FE display consistency
  image: string;
  createdAt: string;
  updatedAt: string;
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
  latitude?: number | null;
  longitude?: number | null;
}

export interface IPaymentDetailsFE {
  // Shape of payment subdocument
  stripePaymentIntentId: string;
  stripeCustomerId: string;
  amountPaid: number; // In cents
  currency: string;
  paymentMethodType?: string | null;
  cardBrand?: string | null;
  cardLast4?: string | null;
  paymentDate?: string; // Changed to optional string to match FE data flow
}

export interface IOrderBaseFE {
  _id: string;
  orderNumber: string;
  packageName: string; // Denormalized name
  packagePrice: number; // Denormalized price (dollars)
  deliveryDays: number; // Denormalized duration/count
  startDate: string; // ISO Date string
  endDate: string; // ISO Date string
  status: OrderStatus; // Use the OrderStatus enum
  deliverySchedule?: string[]; // Array of ISO Date strings (optional if not always fetched)
  deliveryAddress: IDeliveryAddressFE;
  paymentDetails: IPaymentDetailsFE; // Use the defined interface
  deliveryStatus: DeliveryStatusFE; // Use the DeliveryStatus enum
  deliverySequence?: number | null;
  proofOfDeliveryUrl?: string | null;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

export interface IOrderCustomerFE extends IOrderBaseFE {
  // Include populated package/customer stubs if needed, or keep simple
  package?: IOrderPackageInfo | null; // Example if populated
  // Exclude fields not relevant to customer view if necessary
}

export interface IDriverBasicInfo {
  _id: string;
  fullName: string;
}

// Shape of populated assigned driver data in Admin Order list
export interface IAdminOrderDriverPopulated {
  _id: string;
  fullName: string;
  phone?: string; // Optional based on population
  status?: DriverStatus; // Optional based on population
}

export enum DeliveryStatusFE {
  PENDING_ASSIGNMENT = "Pending Assignment",
  ASSIGNED = "Assigned",
  OUT_FOR_DELIVERY = "Out for Delivery",
  DELIVERED = "Delivered",
  FAILED = "Failed",
  CANCELLED = "Cancelled",
}

export interface IOrderAdminFE {
  _id: string;
  orderNumber: string;
  customer: IOrderCustomerInfo | null; // Handle potential null population
  package: IOrderPackageInfo | null; // Handle potential null population
  packageName: string;
  packagePrice: number;
  deliveryDays: number;
  startDate: string;
  endDate: string;
  status: OrderStatus; // Original status
  deliveryStatus: DeliveryStatusFE; // Use the new delivery status
  deliveryAddress: IDeliveryAddressFE;
  paymentDetails?: PaymentDetailsBase; // Make optional if not always present/needed
  assignedDriver?: { _id: string; fullName: string } | null; // Include basic driver info if populated
  deliverySequence?: number | null; // <-- ADDED: Sequence number (optional, nullable)
  proofOfDeliveryUrl?: string;
  createdAt: string;
  updatedAt: string;
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

export interface IOrderFilters {
  status?: OrderStatus | "" | null; // Use the OrderStatus enum
  search?: string | null;
  // startDate?: string | null;
  // endDate?: string | null;
}

export interface IPaginationData {
  totalOrders: number;
  totalPages: number;
  currentPage: number;
  limit?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

// Structure for the Admin Get All Orders API response payload (inside ApiResponse.data)
export interface IAdminOrdersResponse {
  orders: IOrderAdminFE[];
  pagination: IPaginationData;
}

export interface IDeliveryDateSettingFE {
  date: string; // ISO Date string (e.g., "2025-05-15T00:00:00.000Z" or "2025-05-15")
  isEnabled: boolean; // Status set by admin
  notes?: string; // Optional notes from admin
  // Add _id, createdAt, updatedAt if your API returns them and you need them
  // _id?: string;
  // createdAt?: string;
  // updatedAt?: string;
}
