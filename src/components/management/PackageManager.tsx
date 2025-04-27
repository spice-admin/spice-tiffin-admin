// src/components/react/PackageManager.tsx
import React, { useState, useEffect } from "react";
import type { IPackageFE, IPackageFormData, PackageType } from "../../types"; // Adjust path as needed
import * as packageService from "../../services/packageService"; // Adjust path as needed
// Import icons (example using react-icons)
import {
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePlus,
} from "react-icons/hi2"; // Example icons

// --- Props Interface ---
interface PackageManagerProps {
  initialPackages: IPackageFE[];
}

// --- Helper: Format Date ---
const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (e) {
    return "Invalid Date";
  }
};

// --- Helper: Image Fallback ---
const ImageFallback = ({ className }: { className?: string }) => (
  <div
    className={`flex items-center justify-center bg-gray-200 text-gray-400 ${className}`}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  </div>
);

// --- Component ---
const PackageManager: React.FC<PackageManagerProps> = ({ initialPackages }) => {
  const [packages, setPackages] = useState<IPackageFE[]>(initialPackages);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // State for Modals/Forms
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingPackage, setEditingPackage] = useState<IPackageFE | null>(null);

  // Notification Handling
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000); // Auto-hide after 5s
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
  };

  // --- CRUD Handlers (Keep implementations from previous step) ---
  const handleAddPackage = async (formData: IPackageFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await packageService.createPackage(formData);
      if (result.success && result.data) {
        setPackages([...packages, result.data]);
        showNotification(
          "success",
          result.message || "Package added successfully!"
        );
        setIsAddModalOpen(false); // Close modal
      } else {
        throw new Error(result.message || "Unknown error adding package");
      }
    } catch (err) {
      const message = (err as Error).message || "Failed to add package";
      setError(message);
      showNotification("error", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPackage = async (
    id: string,
    formData: Partial<IPackageFormData>
  ) => {
    if (!editingPackage) return; // Should not happen if modal logic is correct
    setIsLoading(true);
    setError(null);
    try {
      const result = await packageService.updatePackage(id, formData);
      if (result.success && result.data) {
        setPackages(packages.map((p) => (p._id === id ? result.data! : p)));
        showNotification(
          "success",
          result.message || "Package updated successfully!"
        );
        setIsEditModalOpen(false); // Close modal
        setEditingPackage(null);
      } else {
        throw new Error(result.message || "Unknown error updating package");
      }
    } catch (err) {
      const message = (err as Error).message || "Failed to update package";
      setError(message);
      showNotification("error", message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this package?")) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await packageService.deletePackage(id);
      if (result.success) {
        setPackages(packages.filter((p) => p._id !== id));
        showNotification(
          "success",
          result.message || "Package deleted successfully!"
        );
      } else {
        throw new Error(result.message || "Unknown error deleting package");
      }
    } catch (err) {
      const message = (err as Error).message || "Failed to delete package";
      setError(message);
      showNotification("error", message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Modal Open/Close ---
  const openEditModal = (pkg: IPackageFE) => {
    setEditingPackage(pkg);
    setIsEditModalOpen(true);
  };

  // --- Render ---
  return (
    <div className="bg-white shadow-md rounded-lg">
      {" "}
      {/* Mimics 'card' */}
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-semibold text-gray-700">Packages</h4>{" "}
          {/* Mimics 'card-title' */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading}
          >
            <HiOutlinePlus className="h-4 w-4" />
            Add Package
          </button>
        </div>
      </div>
      {/* Card Body */}
      <div className="p-4 pt-0">
        {" "}
        {/* pt-0 matches HTML example */}
        {/* Notification Area */}
        {notification && (
          <div
            className={`p-4 my-4 rounded ${
              notification.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {notification.message}
            <button
              onClick={() => setNotification(null)}
              className="float-right font-bold text-lg leading-none"
            >
              &times;
            </button>
          </div>
        )}
        {/* Global Error Display */}
        {error && !notification && (
          <div className="p-4 my-4 rounded bg-red-100 text-red-800">
            <strong>Error:</strong> {error}
          </div>
        )}
        {/* Table Wrapper */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Image
                </th>
                <th scope="col" className="px-4 py-3">
                  Name / Desc
                </th>
                <th scope="col" className="px-4 py-3">
                  Category
                </th>
                <th scope="col" className="px-4 py-3">
                  Type
                </th>
                <th scope="col" className="px-4 py-3">
                  Days
                </th>
                <th scope="col" className="px-4 py-3">
                  Price
                </th>
                <th scope="col" className="px-4 py-3">
                  Created
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && packages.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">
                    Loading packages...
                  </td>
                </tr>
              )}
              {!isLoading && packages.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-gray-500">
                    No packages found. Add one!
                  </td>
                </tr>
              )}
              {packages.map((pkg) => (
                <tr
                  key={pkg._id}
                  className="bg-white border-b hover:bg-gray-50 align-middle"
                >
                  {/* Image Column */}
                  <td className="px-4 py-2">
                    {pkg.image ? (
                      <img
                        src={pkg.image}
                        alt={pkg.name}
                        className="h-10 w-10 rounded-full object-cover"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        } // Hide if image fails to load
                      />
                    ) : (
                      <ImageFallback className="h-10 w-10 rounded-full" />
                    )}
                    {/* Fallback visible if img onError hides the image */}
                    {!pkg.image && (
                      <ImageFallback className="h-10 w-10 rounded-full" />
                    )}
                  </td>
                  {/* Name/Desc Column */}
                  <td className="px-4 py-2">
                    <span className="block font-medium text-gray-900">
                      {pkg.name}
                    </span>
                    {pkg.description && (
                      <span className="block text-xs text-gray-500">
                        {pkg.description}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {pkg.category?.name || (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-2 capitalize">{pkg.type}</td>
                  <td className="px-4 py-2">{pkg.days}</td>
                  <td className="px-4 py-2">${pkg.price.toFixed(2)}</td>
                  <td className="px-4 py-2">{formatDate(pkg.createdAt)}</td>
                  {/* Actions Column */}
                  <td className="px-4 py-2 text-right">
                    <button
                      title="Edit"
                      onClick={() => openEditModal(pkg)}
                      className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                    >
                      <HiOutlinePencilSquare className="h-5 w-5" />
                    </button>
                    <button
                      title="Delete"
                      onClick={() => handleDeletePackage(pkg._id)}
                      className="p-1 text-gray-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed ml-1"
                      disabled={isLoading}
                    >
                      <HiOutlineTrash className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* --- Add/Edit Modals --- */}
      {/* Placeholder Modals - Replace with actual implementation */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add New Package</h2>
            {/* TODO: Replace with AddPackageForm component */}
            <p>Add Package Form Placeholder...</p>
            <p className="mt-4 text-xs text-gray-500">
              Requires implementation of AddPackageForm component.
            </p>
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            {/* Add Submit button inside the actual form component */}
          </div>
        </div>
      )}
      {isEditModalOpen && editingPackage && (
        <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              Edit Package: {editingPackage.name}
            </h2>
            {/* TODO: Replace with EditPackageForm component */}
            <p>Edit Package Form Placeholder...</p>
            <p className="mt-4 text-xs text-gray-500">
              Requires implementation of EditPackageForm component.
            </p>
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingPackage(null);
              }}
              className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            {/* Add Submit button inside the actual form component */}
          </div>
        </div>
      )}
    </div> // End Card
  );
};

export default PackageManager;
