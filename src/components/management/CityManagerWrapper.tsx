// src/components/management/CityManagerWrapper.tsx (Admin Panel)
import React, { useState, useEffect, useCallback } from "react";
import type { ICityAdminFE, ICityFormData } from "../../types";
import {
  getAllCitiesAdminApi,
  createCityAdminApi,
  updateCityAdminApi,
  deleteCityAdminApi,
} from "../../services/city.service";
import CityTable from "./CityTable";
import ManageCityModal from "./ManageCityModal";
// Optional: Import a confirmation library like SweetAlert2 if installed
// import Swal from 'sweetalert2';

const CityManagerWrapper: React.FC = () => {
  const [cities, setCities] = useState<ICityAdminFE[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // For initial load
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false); // For add/edit/delete actions
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingCity, setEditingCity] = useState<ICityAdminFE | null>(null); // null for Add mode

  // Fetch cities function
  const fetchCities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAllCitiesAdminApi();
      if (result.success && Array.isArray(result.data)) {
        setCities(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch cities.");
      }
    } catch (err) {
      setError((err as Error).message);
      setCities([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch cities on mount
  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  // --- Modal Handling ---
  const handleOpenAddModal = () => {
    setEditingCity(null); // Clear editing state for Add mode
    setModalOpen(true);
  };

  const handleOpenEditModal = (city: ICityAdminFE) => {
    setEditingCity(city); // Set city to edit
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCity(null); // Clear editing state on close
  };

  // --- CRUD Operations ---

  // Handle Add/Update submission from modal
  const handleModalSubmit = async (
    formData: ICityFormData,
    cityId?: string
  ) => {
    setIsActionLoading(true); // Indicate loading for the action
    let result;
    try {
      if (cityId) {
        // Editing existing city
        console.log(`Attempting to update city ${cityId}...`, formData);
        result = await updateCityAdminApi(cityId, formData);
      } else {
        // Adding new city
        console.log(`Attempting to add new city...`, formData);
        result = await createCityAdminApi(formData);
      }

      if (result.success && result.data) {
        await fetchCities(); // Refetch the list on success
        handleCloseModal(); // Close modal
        // Optional: Show success notification (e.g., using toast library)
        console.log("City saved successfully:", result.data);
        // Swal.fire('Success!', result.message, 'success');
      } else {
        // Throw error to be caught and displayed in modal
        throw new Error(
          result.message || `Failed to ${cityId ? "update" : "create"} city.`
        );
      }
    } catch (apiError) {
      console.error("Error saving city:", apiError);
      // Re-throw the error so the modal can display it
      throw apiError;
    } finally {
      setIsActionLoading(false); // Reset action loading state
    }
  };

  // Handle Delete action
  const handleDeleteCity = async (cityId: string, cityName: string) => {
    // Simple browser confirmation (replace with styled modal if preferred)
    if (
      !window.confirm(
        `Are you sure you want to delete the city "${cityName}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    // Using Swal example:
    // const confirmation = await Swal.fire({
    //     title: 'Are you sure?',
    //     text: `Delete city "${cityName}"? This cannot be undone.`,
    //     icon: 'warning',
    //     showCancelButton: true,
    //     confirmButtonColor: '#d33',
    //     cancelButtonColor: '#3085d6',
    //     confirmButtonText: 'Yes, delete it!'
    // });
    // if (!confirmation.isConfirmed) return;

    setIsActionLoading(true);
    setError(null); // Clear previous general errors
    try {
      console.log(`Attempting to delete city ${cityId}...`);
      const result = await deleteCityAdminApi(cityId);
      if (result.success) {
        await fetchCities(); // Refetch list on success
        console.log("City deleted successfully.");
        // Swal.fire('Deleted!', result.message, 'success');
      } else {
        throw new Error(result.message || "Failed to delete city.");
      }
    } catch (apiError) {
      console.error("Error deleting city:", apiError);
      setError((apiError as Error).message); // Show error message above table
      // Swal.fire('Error!', (apiError as Error).message || 'Failed to delete city.', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col">
            <h4 className="card-title">Manage Delivery Cities</h4>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-sm btn-primary"
              onClick={handleOpenAddModal}
              disabled={isLoading || isActionLoading} // Disable if loading data or performing action
            >
              <i className="fas fa-plus me-1"></i> {/* Font Awesome Icon */}
              Add City
            </button>
          </div>
        </div>
      </div>
      <div className="card-body pt-0">
        {/* Display general error message */}
        {error &&
          !modalOpen && ( // Don't show general error if modal is open (modal shows its own)
            <div className="alert alert-danger" role="alert">
              Error: {error}
              {/* Optional: Add retry button */}
              <button
                onClick={fetchCities}
                className="btn btn-sm btn-danger ms-2"
              >
                Retry Fetch
              </button>
            </div>
          )}

        <CityTable
          cities={cities}
          isLoading={isLoading} // Pass initial loading state
          isActionLoading={isActionLoading} // Pass action loading state
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteCity}
        />
      </div>

      {/* Add/Edit Modal */}
      <ManageCityModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        initialData={editingCity}
      />
    </div>
  );
};

export default CityManagerWrapper;
