// src/components/management/DriverManagerWrapper.tsx
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path
// We will define types directly in this file as requested.
import DriverTable from "./DriverTable";
import ManageDriverModal from "./ManageDriverModal";
import { HiOutlinePlus } from "react-icons/hi2"; // Example icon

// --- Component-Specific Interfaces (Declared in this file) ---
export interface Driver {
  id: string; // Corresponds to auth.users.id and drivers.id
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  vehicleNumber?: string | null;
  isActive: boolean;
  createdAt?: string; // Registration date from auth.users
}

export interface DriverFormData {
  email: string;
  password?: string; // Required for new, optional for update
  fullName: string; // Made non-optional for form
  phone: string; // Made non-optional for form
  vehicleNumber?: string | null; // Kept optional
  isActive: boolean;
}
// --- End Interfaces ---

const DriverManagerWrapper: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // For general fetch errors
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const showNotification = useCallback(
    (type: "success" | "error", message: string) => {
      setNotification({ type, message });
      // Auto-hide notification
      setTimeout(() => setNotification(null), 5000);
    },
    []
  );

  const fetchDrivers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("[DriverManagerWrapper] Fetching drivers via RPC...");
      const { data, error: rpcError } = await supabase.rpc(
        "get_drivers_with_details"
      );

      if (rpcError) throw rpcError;

      const fetchedDrivers: Driver[] = (data || []).map((d: any) => ({
        id: d.id,
        email: d.email,
        fullName: d.full_name, // Map from snake_case from DB/RPC
        phone: d.phone,
        vehicleNumber: d.vehicle_number,
        isActive: d.is_active,
        createdAt: d.created_at,
      }));

      setDrivers(fetchedDrivers);
      console.log("[DriverManagerWrapper] Drivers fetched:", fetchedDrivers);
    } catch (err: any) {
      const message = err.message || "Failed to fetch drivers";
      console.error(
        "[DriverManagerWrapper] Error in fetchDrivers:",
        message,
        err
      );
      setError(message); // Set general error for display
      // showNotification("error", message); // Or use notification for fetch errors too
      setDrivers([]);
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]); // Added showNotification if used in catch

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const openAddModal = () => {
    setEditingDriver(null);
    setIsModalOpen(true);
    setError(null);
    setNotification(null);
  };
  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setIsModalOpen(true);
    setError(null);
    setNotification(null);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDriver(null);
  };

  const handleFormSubmit = async (formData: DriverFormData) => {
    setError(null); // Clear general error display on new submit attempt

    try {
      if (editingDriver) {
        // --- UPDATE DRIVER ---
        console.log(
          "[DriverManagerWrapper] Updating driver:",
          editingDriver.id,
          formData
        );

        // 1. Update non-auth details in 'drivers' table (can be done client-side if RLS allows admin)
        const driverProfileUpdates: {
          full_name?: string;
          phone?: string;
          vehicle_number?: string | null;
          is_active?: boolean;
        } = {
          full_name: formData.fullName,
          phone: formData.phone,
          vehicle_number: formData.vehicleNumber,
          is_active: formData.isActive,
        };

        const { data: updatedDriverData, error: profileUpdateError } =
          await supabase
            .from("drivers")
            .update(driverProfileUpdates)
            .eq("id", editingDriver.id)
            .select(
              "id, full_name, phone, vehicle_number, is_active, created_at"
            ) // Re-fetch to confirm
            .single();

        if (profileUpdateError) throw profileUpdateError;
        if (!updatedDriverData)
          throw new Error(
            "Failed to get updated driver data after profile update."
          );

        let emailForUpdatedDriver = editingDriver.email; // Assume email doesn't change here

        // 2. Handle password update via Edge Function (if password was provided)
        if (formData.password) {
          console.log(
            "Password change requested for driver:",
            editingDriver.id
          );
          const { data: pwdUpdateResult, error: pwdError } =
            await supabase.functions.invoke("update-driver-password", {
              body: {
                userId: editingDriver.id,
                newPassword: formData.password,
              },
            });
          if (pwdError)
            throw new Error(
              pwdUpdateResult?.error ||
                pwdError.message ||
                "Password update failed."
            );
          if (!pwdUpdateResult?.success)
            throw new Error(
              pwdUpdateResult?.error ||
                "Password update via function was not successful."
            );
          showNotification(
            "success",
            "Password updated successfully. Other details also saved."
          );
        } else {
          showNotification("success", "Driver details updated successfully!");
        }

        // Construct the fully updated driver for local state
        const finalUpdatedDriver: Driver = {
          id: updatedDriverData.id,
          email: emailForUpdatedDriver, // Email is not updated via this flow for simplicity
          fullName: updatedDriverData.full_name,
          phone: updatedDriverData.phone,
          vehicleNumber: updatedDriverData.vehicle_number,
          isActive: updatedDriverData.is_active,
          createdAt: editingDriver.createdAt, // createdAt doesn't change on update
        };
        setDrivers(
          drivers.map((d) =>
            d.id === editingDriver.id ? finalUpdatedDriver : d
          )
        );
      } else {
        // --- CREATE DRIVER ---
        console.log(
          "[DriverManagerWrapper] Invoking 'create-driver' Edge Function with:",
          formData
        );
        if (!formData.email || !formData.password) {
          throw new Error(
            "Email and Password are required to create a new driver."
          );
        }

        const { data: result, error: functionError } =
          await supabase.functions.invoke(
            "create-driver",
            { body: formData } // Edge Function receives the DriverFormData
          );

        if (functionError) {
          const errorMessage =
            result?.error ||
            functionError.message ||
            "Failed to create driver.";
          throw new Error(errorMessage);
        }

        if (result?.success && result.data) {
          // Expect Edge Function to return data matching the Driver interface (or close enough)
          const newDriver: Driver = {
            id: result.data.id,
            email: result.data.email, // Assuming Edge function returns email
            fullName: result.data.full_name,
            phone: result.data.phone,
            vehicleNumber: result.data.vehicle_number,
            isActive: result.data.is_active,
            createdAt: result.data.created_at,
          };
          setDrivers((prevDrivers) => [...prevDrivers, newDriver]);
          showNotification(
            "success",
            result.message || "Driver created successfully!"
          );
        } else {
          throw new Error(
            result?.error || "Unknown error creating driver via Edge Function."
          );
        }
      }
      closeModal();
    } catch (err: any) {
      console.error("[DriverManagerWrapper] Submit Error:", err.message, err);
      // This error will be caught by the modal's submit handler to display locally
      showNotification("error", err.message || "An operation failed."); // Also show global notification
      throw err;
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this driver? This action is permanent."
      )
    ) {
      return;
    }
    try {
      console.log(
        "[DriverManagerWrapper] Invoking 'delete-driver' Edge Function for ID:",
        driverId
      );
      const { data: result, error: functionError } =
        await supabase.functions.invoke("delete-driver", {
          body: { userId: driverId },
        });

      if (functionError) {
        throw new Error(
          result?.error || functionError.message || "Failed to delete driver."
        );
      }
      if (result?.success) {
        setDrivers((prevDrivers) =>
          prevDrivers.filter((d) => d.id !== driverId)
        );
        showNotification(
          "success",
          result.message || "Driver deleted successfully!"
        );
      } else {
        throw new Error(
          result?.error || "Unknown error during driver deletion."
        );
      }
    } catch (err: any) {
      console.error("[DriverManagerWrapper] Delete Error:", message, err);
      showNotification("error", err.message || "Failed to delete driver.");
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col">
            <h4 className="card-title">Manage Drivers</h4>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-sm btn-primary d-flex align-items-center"
              onClick={openAddModal}
              disabled={isLoading}
            >
              <HiOutlinePlus size={18} className="me-1" /> Add Driver
            </button>
          </div>
        </div>
      </div>
      <div className="card-body pt-0">
        {notification && (
          <div
            className={`alert mt-3 ${
              notification.type === "success" ? "alert-success" : "alert-danger"
            } alert-dismissible fade show`}
            role="alert"
          >
            {notification.message}
            <button
              type="button"
              className="btn-close"
              onClick={() => setNotification(null)}
              aria-label="Close"
            ></button>
          </div>
        )}
        {/* Display general fetch error if not related to a specific notification */}
        {error && !notification && (
          <div className="alert alert-danger mt-3">{error}</div>
        )}

        <DriverTable
          drivers={drivers}
          isLoading={isLoading && drivers.length === 0}
          onEdit={openEditModal}
          onDelete={handleDeleteDriver}
          isActionLoading={isLoading} // Simplification: use main isLoading for now
        />
      </div>
      <ManageDriverModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        initialData={editingDriver}
      />
    </div>
  );
};

export default DriverManagerWrapper;
