// src/components/management/CityManagerWrapper.tsx
import React, { useState, useEffect, useCallback } from "react";
import type { City, CityFormData } from "../../types";
import { supabase } from "../../lib/supabaseClient"; // Import Supabase client
import CityTable from "./CityTable";
import ManageCityModal from "./ManageCityModal"; // We'll create/adapt this

const CityManagerWrapper: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]); // Use new City type
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingCity, setEditingCity] = useState<City | null>(null); // Use new City type

  const fetchCities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("cities")
        .select("*")
        .order("name", { ascending: true }); // Order by name

      if (fetchError) throw fetchError;
      setCities(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch cities.");
      setCities([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  const handleOpenAddModal = () => {
    setEditingCity(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (city: City) => {
    // Use new City type
    setEditingCity(city);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCity(null);
  };

  const handleModalSubmit = async (
    formData: CityFormData,
    cityId?: string // cityId will be string (UUID from Supabase)
  ) => {
    setIsActionLoading(true);
    setError(null); // Clear previous errors specific to this operation
    try {
      let responseError;
      if (cityId) {
        // Editing
        const { error } = await supabase
          .from("cities")
          .update({ name: formData.name.trim() /*, any other fields */ })
          .eq("id", cityId);
        responseError = error;
      } else {
        // Adding
        const { error } = await supabase
          .from("cities")
          .insert([{ name: formData.name.trim() /*, any other fields */ }]);
        responseError = error;
      }

      if (responseError) {
        if (responseError.code === "23505") {
          // Unique constraint violation
          throw new Error(`City "${formData.name.trim()}" already exists.`);
        }
        throw responseError;
      }

      await fetchCities();
      handleCloseModal();
      // Swal.fire('Success!', `City successfully ${cityId ? "updated" : "added"}!`, 'success'); // If you use Swal
      console.log(`City successfully ${cityId ? "updated" : "added"}!`);
    } catch (apiError: any) {
      console.error("Error saving city:", apiError);
      setError(
        apiError.message || `Failed to ${cityId ? "update" : "create"} city.`
      );
      throw apiError;
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteCity = async (cityId: string, cityName: string) => {
    // Using Swal from your category example, or window.confirm
    const confirmResult =
      (await (window as any).Swal?.fire({
        title: "Are you sure?",
        text: `You are about to delete the city "${cityName}". This action cannot be undone.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, delete it!",
      })) ||
      window.confirm(
        `Are you sure you want to delete the city "${cityName}"? This action cannot be undone.`
      );

    // Check if isConfirmed exists (for Swal) or if confirmResult is true (for window.confirm)
    if (!(confirmResult.isConfirmed === true || confirmResult === true)) {
      return;
    }

    setIsActionLoading(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase
        .from("cities")
        .delete()
        .eq("id", cityId);

      if (deleteError) throw deleteError;

      await fetchCities();
      // Swal.fire('Deleted!', `City "${cityName}" has been deleted.`, 'success'); // If using Swal
      console.log(`City "${cityName}" has been deleted.`);
    } catch (apiError: any) {
      console.error("Error deleting city:", apiError);
      setError(apiError.message || "Failed to delete city.");
      // Swal.fire('Error!', apiError.message || 'Failed to delete city.', 'error'); // If using Swal
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
              disabled={isLoading || isActionLoading}
            >
              <i className="fas fa-plus me-1"></i> Add City
            </button>
          </div>
        </div>
      </div>
      <div className="card-body pt-0">
        {error && !modalOpen && (
          <div className="alert alert-danger" role="alert">
            Error: {error}
            <button
              onClick={() => {
                fetchCities();
                setError(null);
              }}
              className="btn btn-sm btn-danger ms-2"
            >
              Retry
            </button>
          </div>
        )}
        <CityTable
          cities={cities}
          isLoading={isLoading}
          isActionLoading={isActionLoading}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteCity}
        />
      </div>
      <ManageCityModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit} // This will be called from the modal
        initialData={editingCity}
        isActionLoading={isActionLoading} // Pass loading state to modal
      />
    </div>
  );
};

export default CityManagerWrapper;
