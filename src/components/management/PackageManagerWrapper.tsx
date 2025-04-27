// src/components/management/PackageManagerWrapper.tsx
import React, { useState, useEffect, useCallback } from "react";
import type { IPackageFE, IPackageFormData } from "../../types";
import * as packageService from "../../services/packageService";
import PackageTable from "./PackageTable"; // The refactored table component
import ManagePackageModal from "./ManagePackageModal"; // The modal component
// Assuming Font Awesome/Line Awesome are globally included via your layout's CSS
// Otherwise, you might need react-icon imports if configured differently.

const PackageManagerWrapper: React.FC = () => {
  const [packages, setPackages] = useState<IPackageFE[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading initially
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPackage, setEditingPackage] = useState<IPackageFE | null>(null); // null for Add, object for Edit

  // --- Data Fetching ---
  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await packageService.getAllPackages();
      setPackages(data);
    } catch (err) {
      const message = (err as Error).message || "Failed to fetch packages";
      setError(message);
      showNotification("error", message);
      setPackages([]); // Clear packages on error
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array, fetch once on mount

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // --- Notification Handling ---
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000); // Auto-hide after 5s
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: "success" | "error", message: string) => {
    // Simple implementation - replace with a proper toast library if available
    setNotification({ type, message });
    console.log(`Notification (${type}): ${message}`); // Log for debugging
  };

  // --- Modal Handling ---
  const openAddModal = () => {
    setEditingPackage(null); // Ensure it's in 'Add' mode
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: IPackageFE) => {
    setEditingPackage(pkg); // Set the package to edit
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPackage(null); // Clear editing state when closing
  };

  // --- CRUD Handlers ---
  const handleFormSubmit = async (formData: IPackageFormData) => {
    setIsLoading(true); // Indicate loading state for the operation
    setError(null);
    let result;
    try {
      if (editingPackage) {
        // Update existing package
        result = await packageService.updatePackage(
          editingPackage._id,
          formData
        );
        if (result.success && result.data) {
          setPackages(
            packages.map((p) =>
              p._id === editingPackage._id ? result.data! : p
            )
          );
          showNotification(
            "success",
            result.message || "Package updated successfully!"
          );
        } else {
          throw new Error(result.message || "Failed to update package");
        }
      } else {
        // Create new package
        result = await packageService.createPackage(formData);
        if (result.success && result.data) {
          setPackages([...packages, result.data]);
          showNotification(
            "success",
            result.message || "Package created successfully!"
          );
        } else {
          throw new Error(result.message || "Failed to create package");
        }
      }
      closeModal(); // Close modal on success
    } catch (err) {
      const message = (err as Error).message || "An error occurred";
      setError(message); // Set potential error message for modal/form
      showNotification("error", message);
      // Keep modal open on error? Or close? User choice. Let's keep it open.
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    // Confirmation dialog
    // Assuming standard browser confirm. Use a styled modal confirm if needed.
    if (!window.confirm("Are you sure you want to delete this package?")) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await packageService.deletePackage(id);
      if (result.success) {
        setPackages(packages.filter((p) => p._id !== id)); // Update state
        showNotification(
          "success",
          result.message || "Package deleted successfully!"
        );
      } else {
        throw new Error(result.message || "Failed to delete package");
      }
    } catch (err) {
      const message = (err as Error).message || "Failed to delete package";
      setError(message);
      showNotification("error", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      {" "}
      {/* Use the class name from your HTML */}
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col">
            <h4 className="card-title">Packages</h4>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-sm btn-primary"
              onClick={openAddModal} // Trigger React state change
              disabled={isLoading}
            >
              <i className="fas fa-plus me-1"></i>{" "}
              {/* Font Awesome icon class */}
              Add Package
            </button>
          </div>
        </div>
      </div>
      <div className="card-body pt-0">
        {/* Notification Area - Basic Implementation */}
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
        {/* Global Error Display (if not handled by notification) */}
        {error && !notification && (
          <div className="alert alert-danger" role="alert">
            <strong>Error:</strong> {error}
          </div>
        )}

        <PackageTable
          packages={packages}
          isLoading={isLoading && packages.length === 0} // Show loading only initially or if empty
          onEdit={openEditModal}
          onDelete={handleDeletePackage}
          isActionLoading={isLoading} // Disable row actions during any operation
        />
      </div>
      {/* Render the Modal */}
      <ManagePackageModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        initialData={editingPackage} // Pass package data for editing, null for adding
        isLoading={isLoading} // Pass loading state to disable form during submission
      />
    </div>
  );
};

export default PackageManagerWrapper;
