// src/components/management/DriverManagerWrapper.tsx

import React, { useState, useEffect, useCallback } from "react";
import type { IDriverFE, IDriverFormData } from "../../types"; // Adjust path
import * as driverService from "../../services/driver.service"; // Adjust path
import DriverTable from "./DriverTable"; // Adjust path
import ManageDriverModal from "./ManageDriverModal"; // Adjust path

const DriverManagerWrapper: React.FC = () => {
  const [drivers, setDrivers] = useState<IDriverFE[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDriver, setEditingDriver] = useState<IDriverFE | null>(null); // null for Add, object for Edit

  // --- Data Fetching ---
  const fetchDrivers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // --- ADD LOG HERE ---

      const response = await driverService.getAllDrivers();
      // --- ADD LOG HERE ---

      if (response.success) {
        // --- ADD LOG HERE ---

        setDrivers(response.data); // data should be guaranteed array by service now
      } else {
        // --- ADD LOG HERE ---
        console.log(">>> Wrapper: Service call failed, setting empty array.");
        throw new Error(response.message || "Failed to fetch drivers"); // Throw error to be caught below
      }
    } catch (err: any) {
      const message = err.message || "Failed to fetch drivers";
      console.error(">>> Wrapper: Error in fetchDrivers:", message); // Log error caught
      setError(message);
      showNotification("error", message);
      setDrivers([]); // Ensure drivers is an empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // --- Notification Handling ---
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000); // Auto-hide
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    console.log(`Notification (${type}): ${message}`);
  };

  // --- Modal Handling ---
  const openAddModal = () => {
    setEditingDriver(null);
    setIsModalOpen(true);
  };

  const openEditModal = (driver: IDriverFE) => {
    setEditingDriver(driver);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDriver(null);
  };

  // --- CRUD Handlers ---
  const handleFormSubmit = async (formData: IDriverFormData) => {
    // The ManageDriverModal now handles its own isSubmitting state
    // We might still want a general loading indicator here if needed
    // setIsLoading(true);
    setError(null);
    let result;
    try {
      if (editingDriver) {
        // Update: Send only changed data if possible, or full validated data.
        // Remove password if it wasn't entered/changed in the modal form.
        const updateData: Partial<IDriverFormData> = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        result = await driverService.updateDriver(
          editingDriver._id,
          updateData
        );
        if (result.success && result.data) {
          setDrivers(
            drivers.map((d) => (d._id === editingDriver._id ? result.data! : d))
          );
          showNotification(
            "success",
            result.message || "Driver updated successfully!"
          );
        } else {
          throw new Error(result.message || "Failed to update driver");
        }
      } else {
        // Create: Password should be required by the form/modal validation
        if (!formData.password) {
          throw new Error("Password is required to create a driver."); // Should be caught by modal validation ideally
        }
        result = await driverService.createDriver(formData);
        if (result.success && result.data) {
          setDrivers([...drivers, result.data]);
          showNotification(
            "success",
            result.message || "Driver created successfully!"
          );
        } else {
          throw new Error(result.message || "Failed to create driver");
        }
      }
      closeModal(); // Close modal on success
    } catch (err: any) {
      const message = err.message || "An error occurred";
      setError(message); // Set error message potentially for the modal to display
      showNotification("error", message);
      // Decide whether to keep modal open on error - let's keep it open
      throw err; // Re-throw error so the modal's submit handler catches it
    } finally {
      // setIsLoading(false); // May not be needed if modal handles its own submit state
    }
  };

  const handleDeleteDriver = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this driver?")) {
      return;
    }
    setIsLoading(true); // Indicate loading for the delete action
    setError(null);
    try {
      const result = await driverService.deleteDriver(id);
      if (result.success) {
        setDrivers(drivers.filter((d) => d._id !== id));
        showNotification(
          "success",
          result.message || "Driver deleted successfully!"
        );
      } else {
        throw new Error(result.message || "Failed to delete driver");
      }
    } catch (err: any) {
      const message = err.message || "Failed to delete driver";
      setError(message);
      showNotification("error", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col">
            <h4 className="card-title">Drivers</h4>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-sm btn-primary"
              onClick={openAddModal}
              disabled={isLoading} // Disable if initial load is happening
            >
              <i className="fas fa-plus me-1"></i> Add Driver
            </button>
          </div>
        </div>
      </div>
      <div className="card-body pt-0">
        {/* Notification Area */}
        {notification && (
          <div
            className={`alert ${
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
        {/* Global Error Display (if needed beyond notifications) */}
        {/* {error && !notification && (...)} */}

        <DriverTable
          drivers={drivers}
          isLoading={isLoading && drivers.length === 0}
          onEdit={openEditModal}
          onDelete={handleDeleteDriver}
          isActionLoading={isLoading} // Disable actions during fetch/delete
        />
      </div>
      {/* Render the Modal */}
      <ManageDriverModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        initialData={editingDriver}
        // No separate loading prop needed if modal handles its own submission state
      />
    </div>
  );
};

export default DriverManagerWrapper;
