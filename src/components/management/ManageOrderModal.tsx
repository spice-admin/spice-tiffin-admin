// src/components/management/ManageOrderModal.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  type ChangeEvent,
} from "react";
import Swal from "sweetalert2";
import {
  getAdminOrderByIdApi,
  updateAdminOrderApi,
} from "../../services/order.service"; // Adjust path
import {
  getDriversListApi,
  type IDriverBasicInfo,
} from "../../services/driver.service"; // Adjust path
import type {
  IOrderAdminFE,
  OrderStatus,
  DeliveryStatusFE,
  IDeliveryAddressFE,
} from "../../types"; // Adjust path
import { formatDate } from "../../utils/date"; // Adjust path
import { formatCurrencyCAD } from "../../utils/currency"; // Adjust path

// Import status/delivery status enums if needed for dropdown options
// import { OrderStatus, DeliveryStatus } from '../../types'; // Might already be imported via IOrderAdminFE

interface ManageOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null; // ID of the order to view/edit
  onSaveSuccess: () => void; // Callback to refresh table in parent
}

// Helper to format date for input type="date" (YYYY-MM-DD)
const formatDateForInput = (
  dateString: string | Date | undefined | null
): string => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    // Ensure date parts are extracted based on UTC if the input string was ISO UTC
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = date.getUTCDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (e) {
    return "";
  }
};

const ManageOrderModal: React.FC<ManageOrderModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onSaveSuccess,
}) => {
  // Use Partial to allow gradual loading and editing
  const [orderData, setOrderData] = useState<Partial<IOrderAdminFE> | null>(
    null
  );
  const [originalOrderData, setOriginalOrderData] =
    useState<Partial<IOrderAdminFE> | null>(null); // To compare changes
  const [drivers, setDrivers] = useState<IDriverBasicInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Order Details & Drivers when modal opens with an orderId
  useEffect(() => {
    let isMounted = true; // Prevent state updates if unmounted

    const fetchDrivers = async () => {
      try {
        console.log("[Modal] Fetching drivers...");
        const res = await getDriversListApi();
        if (isMounted && res.success && res.data) {
          setDrivers(res.data);
        } else if (isMounted) {
          console.warn("Could not fetch drivers list:", res.message);
        }
      } catch (err) {
        if (isMounted) console.error("Error fetching drivers:", err);
      }
    };

    const fetchOrder = async (id: string) => {
      setIsLoading(true);
      setError(null);
      setOrderData(null);
      setOriginalOrderData(null);
      console.log(`[Modal] Fetching order ${id}`);
      try {
        const response = await getAdminOrderByIdApi(id);
        if (isMounted && response.success && response.data) {
          setOrderData(response.data);
          setOriginalOrderData(response.data); // Store original for comparison/reset
          console.log(`[Modal] Order ${id} data loaded.`);
        } else if (isMounted) {
          throw new Error(response.message || `Order ${id} not found.`);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Could not load order.");
        console.error(`Modal: Error loading order ${id}`, err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (isOpen && orderId) {
      if (drivers.length === 0) fetchDrivers(); // Fetch drivers only if not already fetched
      fetchOrder(orderId);
    } else {
      // Clear data if modal is closed or no ID
      setOrderData(null);
      setOriginalOrderData(null);
      setError(null);
      setIsLoading(false);
      setIsSaving(false);
      // Maybe clear drivers too? Or keep cached? setDrivers([]);
    }

    return () => {
      isMounted = false;
    }; // Cleanup on unmount
  }, [orderId, isOpen]); // Re-run when orderId or isOpen changes

  // --- Form Input Handler ---
  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value, type } = e.target;

      setOrderData((prevData) => {
        if (!prevData) return null;

        // Handle nested deliveryAddress fields
        if (name.startsWith("deliveryAddress.")) {
          const field = name.split(".")[1] as keyof IDeliveryAddressFE;
          // Create address object if it doesn't exist
          const currentAddress = prevData.deliveryAddress || {};
          return {
            ...prevData,
            deliveryAddress: { ...currentAddress, [field]: value },
          };
        }

        // Handle potential number conversions
        if (
          type === "number" ||
          name === "deliverySequence" ||
          name === "packagePrice" ||
          name === "deliveryDays"
        ) {
          // Allow empty string, otherwise parse as number
          const numValue = value === "" ? null : parseInt(value, 10); // Or parseFloat for price? Use cents? Assuming integer/float based on schema.
          return { ...prevData, [name]: isNaN(numValue!) ? "" : numValue }; // Store empty string or number
        }

        // Handle other direct fields
        return { ...prevData, [name]: value };
      });
    },
    []
  );

  // --- Save Handler ---
  const handleSave = useCallback(async () => {
    if (!orderId || !orderData || !originalOrderData || isSaving) return;

    setIsSaving(true);
    setError(null);

    // Determine changed fields to send only necessary updates
    const updatePayload: Partial<IOrderAdminFE> = {};
    const editableFields: Array<keyof IOrderAdminFE> = [
      // Explicitly list editable fields again
      "status",
      "deliveryStatus",
      "assignedDriver",
      "deliverySequence",
      "proofOfDeliveryUrl",
      "deliveryAddress",
      "startDate",
      "endDate",
      "packageName",
      "packagePrice",
      "deliveryDays",
      "deliverySchedule",
    ];

    let hasChanges = false;
    for (const key of editableFields) {
      // Special handling for objects/arrays
      if (key === "deliveryAddress") {
        if (
          JSON.stringify(orderData.deliveryAddress) !==
          JSON.stringify(originalOrderData.deliveryAddress)
        ) {
          updatePayload.deliveryAddress = orderData.deliveryAddress;
          hasChanges = true;
        }
      } else if (key === "deliverySchedule") {
        if (
          JSON.stringify(orderData.deliverySchedule) !==
          JSON.stringify(originalOrderData.deliverySchedule)
        ) {
          // Ensure dates are valid strings if sending array
          updatePayload.deliverySchedule = orderData.deliverySchedule?.map(
            (d) => new Date(d).toISOString()
          );
          hasChanges = true;
        }
      } else if (key === "assignedDriver") {
        // Compare based on ID, handle nulls and object/string cases
        const currentDriverId =
          (originalOrderData.assignedDriver as any)?._id?.toString() ||
          originalOrderData.assignedDriver?.toString() ||
          null;
        const newDriverId =
          (orderData.assignedDriver as any)?._id?.toString() ||
          orderData.assignedDriver?.toString() ||
          null;
        if (currentDriverId !== newDriverId) {
          // Send only the ID string or null
          updatePayload.assignedDriver = newDriverId
            ? new mongoose.Types.ObjectId(newDriverId)
            : null;
          hasChanges = true;
        }
      }
      // Compare other primitive values
      else if (
        Object.prototype.hasOwnProperty.call(orderData, key) &&
        orderData[key] !== originalOrderData[key]
      ) {
        updatePayload[key] = orderData[key];
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      setError("No changes detected.");
      setIsSaving(false);
      return;
    }

    console.log("Modal: Saving updates for order:", orderId, updatePayload);

    try {
      const result = await updateAdminOrderApi(orderId, updatePayload);
      if (result.success && result.data) {
        Swal.fire("Success!", "Order updated successfully.", "success");
        onSaveSuccess(); // Trigger table refresh in parent
        onClose(); // Close modal
      } else {
        throw new Error(result.message || "Failed to update order.");
      }
    } catch (err: any) {
      console.error("Modal: Error saving order:", err);
      setError(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  }, [orderId, orderData, originalOrderData, onSaveSuccess, onClose, isSaving]);

  // --- Render Logic ---
  if (!isOpen) return null;

  // Define OrderStatus and DeliveryStatus options (assuming imported enums)
  // If they are simple types, define arrays here
  const orderStatusOptions = Object.values(OrderStatus); // Use if OrderStatus is enum
  const deliveryStatusOptions = Object.values(DeliveryStatus); // Use if DeliveryStatus is enum
  // Or const orderStatusOptions = ['Active', 'Expired', 'Cancelled'];

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog-order">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Order Details: #
              {orderData?.orderNumber || orderId?.slice(-6) || "..."}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
              disabled={isSaving}
            ></button>
          </div>
          <div className="modal-body">
            {isLoading && (
              <div className="modal-loading">
                <span className="spinner-border"></span> Loading Order...
              </div>
            )}
            {error && !isLoading && !isSaving && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}{" "}
            {/* Show general error */}
            {/* Display specific saving error */}
            {error && isSaving && (
              <div className="alert alert-danger" role="alert">
                Save failed: {error}
              </div>
            )}
            {!isLoading && !error && orderData && (
              // Use a form even if submission is via button onClick
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
              >
                <div className="order-modal-grid">
                  {/* Read Only Section */}
                  <fieldset className="order-modal-section" disabled>
                    <legend>Order Information</legend>
                    <div className="form-group-inline">
                      <span>Order #:</span>{" "}
                      <strong>{orderData.orderNumber}</strong>
                    </div>
                    <div className="form-group-inline">
                      <span>Created:</span>{" "}
                      <strong>{formatDate(orderData.createdAt)}</strong>
                    </div>
                    <div className="form-group-inline">
                      <span>Package:</span>{" "}
                      <strong>
                        {orderData.package?.name || orderData.packageName}
                      </strong>
                    </div>
                    <div className="form-group-inline">
                      <span>Price:</span>{" "}
                      <strong>
                        {formatCurrencyCAD(orderData.packagePrice)}
                      </strong>
                    </div>
                    <div className="form-group-inline">
                      <span>Deliveries:</span>{" "}
                      <strong>{orderData.deliveryDays}</strong>
                    </div>
                    <div className="form-group-inline">
                      <span>Payment ID:</span>{" "}
                      <small>
                        {orderData.paymentDetails?.stripePaymentIntentId ||
                          "N/A"}
                      </small>
                    </div>
                    <div className="form-group-inline">
                      <span>Payment Status:</span>{" "}
                      <strong>
                        {orderData.paymentDetails?.status || "N/A"}
                      </strong>
                    </div>
                  </fieldset>

                  {/* Read Only Customer Section */}
                  <fieldset className="order-modal-section" disabled>
                    <legend>Customer</legend>
                    <div className="form-group-inline">
                      <span>Name:</span>{" "}
                      <strong>{orderData.customer?.fullName || "N/A"}</strong>
                    </div>
                    <div className="form-group-inline">
                      <span>Email:</span>{" "}
                      <strong>{orderData.customer?.email || "N/A"}</strong>
                    </div>
                    <div className="form-group-inline">
                      <span>Phone:</span>{" "}
                      <strong>{orderData.customer?.mobile || "N/A"}</strong>
                    </div>
                    <div className="form-group-inline">
                      <span>Verified:</span>{" "}
                      <strong>
                        {orderData.customer?.verification ? "Yes" : "No"}
                      </strong>
                    </div>
                  </fieldset>

                  {/* Editable Section 1: Status & Dates */}
                  <fieldset className="order-modal-section" disabled={isSaving}>
                    <legend>Status & Scheduling</legend>
                    <div className="form-group">
                      <label htmlFor="status">Order Status</label>
                      <select
                        id="status"
                        name="status"
                        className="form-select"
                        value={orderData.status || ""}
                        onChange={handleChange}
                      >
                        {orderStatusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="deliveryStatus">Delivery Status</label>
                      <select
                        id="deliveryStatus"
                        name="deliveryStatus"
                        className="form-select"
                        value={orderData.deliveryStatus || ""}
                        onChange={handleChange}
                      >
                        {deliveryStatusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="startDate">Start Date</label>
                      <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        className="form-control"
                        value={formatDateForInput(orderData.startDate)} // Format for input
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="endDate">End Date</label>
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        className="form-control"
                        value={formatDateForInput(orderData.endDate)} // Format for input
                        onChange={handleChange}
                      />
                    </div>
                    {/* TODO: Add deliverySchedule editor? Very complex - maybe just display */}
                    {/* <div className="form-group">
                                             <label>Delivery Schedule</label>
                                             <div className='schedule-display'>{orderData.deliverySchedule?.map(d => formatDate(d)).join(', ')}</div>
                                         </div> */}
                  </fieldset>

                  {/* Editable Section 2: Delivery & Assignment */}
                  <fieldset className="order-modal-section" disabled={isSaving}>
                    <legend>Delivery Details</legend>
                    <div className="form-group">
                      <label htmlFor="assignedDriver">Assigned Driver</label>
                      <select
                        id="assignedDriver"
                        name="assignedDriver"
                        className="form-select"
                        // Read driver ID from populated object or direct ID string/null
                        value={
                          (orderData.assignedDriver as any)?._id ??
                          orderData.assignedDriver ??
                          ""
                        }
                        onChange={handleChange}
                      >
                        <option value="">Unassigned</option>
                        {drivers.map((driver) => (
                          <option key={driver._id} value={driver._id}>
                            {driver.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="deliverySequence">
                        Delivery Sequence
                      </label>
                      <input
                        type="number"
                        id="deliverySequence"
                        name="deliverySequence"
                        className="form-control"
                        value={orderData.deliverySequence ?? ""}
                        onChange={handleChange}
                        min="0"
                        placeholder="e.g., 1"
                      />
                    </div>
                    {/* Address Fields */}
                    <div className="form-group">
                      <label htmlFor="address">Delivery Address</label>
                      <input
                        type="text"
                        id="address"
                        name="deliveryAddress.address"
                        className="form-control"
                        value={orderData.deliveryAddress?.address || ""}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="city">City</label>
                      <input
                        type="text"
                        id="city"
                        name="deliveryAddress.city"
                        className="form-control"
                        value={orderData.deliveryAddress?.city || ""}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="postalCode">Postal Code</label>
                      <input
                        type="text"
                        id="postalCode"
                        name="deliveryAddress.postalCode"
                        className="form-control"
                        value={orderData.deliveryAddress?.postalCode || ""}
                        onChange={handleChange}
                      />
                    </div>
                    {/* Optional: Display Lat/Lng if available */}
                    {orderData.deliveryAddress?.latitude && (
                      <div className="form-group-inline">
                        <small>Coords:</small>{" "}
                        <small>
                          {orderData.deliveryAddress.latitude?.toFixed(5)},{" "}
                          {orderData.deliveryAddress.longitude?.toFixed(5)}
                        </small>
                      </div>
                    )}
                  </fieldset>
                </div>
                {/* end grid */}
                {/* Hidden button to allow form submission via Enter key if desired, but usually rely on explicit save button */}
                {/* <button type="submit" style={{display: 'none'}} aria-hidden="true"></button> */}
              </form>
            )}
            {!isLoading && !error && !orderData && (
              <div className="text-center p-5">Order data not available.</div>
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="button" // Important: type="button" to prevent accidental form submission
              className="btn btn-primary"
              onClick={handleSave} // Trigger save manually
              disabled={isLoading || isSaving || !orderData}
            >
              {isSaving && (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  aria-hidden="true"
                ></span>
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
      {/* Add necessary CSS for modal, grid, forms */}
      <style>{`
                .modal-backdrop { position: fixed; inset: 0; background-color: rgba(0,0,0,0.6); z-index: 1040; display: flex; align-items: center; justify-content: center; padding: 1rem; }
                .modal-dialog-order { background-color: white; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); width: 95%; max-width: 800px; display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; /* Prevent backdrop scroll */}
                .modal-content { display: flex; flex-direction: column; flex-grow: 1; /* Allows body to scroll */ }
                .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #dee2e6; flex-shrink: 0; }
                .modal-title { font-size: 1.25rem; margin-bottom: 0; font-weight: 500; }
                .btn-close { background: transparent url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23000'%3e%3cpath d='M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z'/%3e%3c/svg%3e") center/1em auto no-repeat; border: 0; border-radius: .25rem; width: 1.5em; height: 1.5em; padding: .25em .25em; opacity: .5; cursor: pointer; }
                .modal-body { padding: 1.5rem; overflow-y: auto; flex-grow: 1; }
                .modal-footer { display: flex; justify-content: flex-end; flex-wrap: wrap; align-items: center; padding: 0.75rem 1.5rem; border-top: 1px solid #dee2e6; gap: 0.5rem; flex-shrink: 0; background-color: #f9f9f9; }
                .modal-loading { padding: 3rem; text-align: center; color: #555; font-size: 1.1rem; }

                /* Form layout inside modal */
                .order-modal-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem 2rem; }
                .order-modal-section { border: 1px solid #eee; border-radius: 6px; padding: 1rem 1.25rem 0.5rem 1.25rem; margin: 0; }
                .order-modal-section legend { font-weight: 600; padding: 0 0.5rem; font-size: 0.95rem; color: #333; margin-bottom: 0.75rem; }
                .form-group { margin-bottom: 1rem; }
                .form-group label { display: block; margin-bottom: 0.3rem; font-size: 0.8rem; color: #555; font-weight: 500; }
                .form-control, .form-select { display: block; width: 100%; padding: 0.5rem 0.75rem; font-size: 0.9rem; border: 1px solid #ccc; border-radius: 4px; background-color: #fff; }
                .form-control:disabled, .form-select:disabled { background-color: #e9ecef; opacity: 0.7; cursor: not-allowed; }
                fieldset:disabled { opacity: 0.8; }
                fieldset:disabled input, fieldset:disabled select, fieldset:disabled textarea { background-color: #f8f9fa; }
                fieldset:disabled strong { color: #495057; }

                .form-group-inline { font-size: 0.9rem; margin-bottom: 0.6rem; color: #333; display: flex; flex-wrap: wrap; }
                .form-group-inline span:first-child { color: #555; min-width: 95px; display: inline-block; flex-shrink: 0; padding-right: 5px; }
                .form-group-inline strong { color: #111; }
                .form-group-inline small { font-size: 0.8em; color: #666; word-break: break-all; }

                /* Ensure spinner styles are loaded */
                .spinner-border { /* ... */ } .spinner-border-sm { /* ... */ } .me-2 { /* ... */ }
                .alert { /* ... */ } .alert-danger { /* ... */ }
                .btn { /* ... */ } .btn-secondary { /* ... */ } .btn-primary { /* ... */ }
                .btn:disabled { /* ... */ }
            `}</style>
    </div>
  );
};

export default ManageOrderModal;
