import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path
import type { Package, PackageFormData, CategoryBasic } from "../../types"; // Adjust path
import PackageTable from "./PackageTable";
import ManagePackageModal from "./ManagePackageModal";
import Swal from "sweetalert2"; // Assuming you have SweetAlert2 installed

const PackageManagerWrapper: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false); // For add/edit/delete actions
  const [error, setError] = useState<string | null>(null); // General error for the wrapper/table

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  const fetchPackages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from("packages")
        .select(
          `
          *,
          categories (id, name)
        `
        )
        .order("name", { ascending: true });

      if (fetchError) throw fetchError;
      setPackages(data || []);
    } catch (err: any) {
      const message = err.message || "Failed to fetch packages";
      setError(message);
      setPackages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const openAddModal = () => {
    setEditingPackage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: Package) => {
    setEditingPackage(pkg);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPackage(null);
  };

  const handleFormSubmit = async (
    formData: PackageFormData,
    packageId?: string
  ) => {
    setIsActionLoading(true);
    // setError(null); // Error state is handled in modal or set below if general

    const packagePayload = {
      name: formData.name,
      description: formData.description || null,
      price: Number(formData.price),
      type: formData.type,
      days: Number(formData.days),
      category_id: formData.category,
      image_url: formData.image_url || null,
      is_active: formData.is_active,
    };

    try {
      let supaError;
      if (packageId) {
        // Update
        const { error } = await supabase
          .from("packages")
          .update(packagePayload)
          .eq("id", packageId)
          .select(); // Select to get the updated row, useful for optimistic updates or just confirmation
        supaError = error;
      } else {
        // Create
        const { error } = await supabase
          .from("packages")
          .insert([packagePayload])
          .select();
        supaError = error;
      }

      if (supaError) {
        if (
          supaError.code === "23505" &&
          supaError.message.includes("packages_name_key")
        ) {
          // Check for unique name violation
          throw new Error(`Package name "${formData.name}" already exists.`);
        }
        throw supaError;
      }

      Swal.fire(
        "Success!",
        `Package ${packageId ? "updated" : "created"} successfully!`,
        "success"
      );
      closeModal();
      await fetchPackages(); // Refetch
    } catch (err: any) {
      console.error(
        `Error ${packageId ? "updating" : "creating"} package:`,
        err
      );
      // This error will be re-thrown to the modal by its onSubmit logic if needed
      // Or display a generic error message using Swal
      Swal.fire(
        "Error!",
        err.message || `Failed to ${packageId ? "update" : "create"} package.`,
        "error"
      );
      throw err; // Re-throw so modal's isSubmitting resets if it catches
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeletePackage = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete package: "${name}". This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    setIsActionLoading(true);
    // setError(null);
    try {
      const { error: deleteError } = await supabase
        .from("packages")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      Swal.fire("Deleted!", `Package "${name}" has been deleted.`, "success");
      setPackages((prev) => prev.filter((p) => p.id !== id)); // Optimistic update
      // await fetchPackages(); // Or refetch
    } catch (err: any) {
      console.error("Error deleting package:", err);
      Swal.fire("Error!", err.message || "Failed to delete package.", "error");
      // setError(message); // Set error for display above table if preferred
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col">
            <h4 className="card-title">Manage Packages</h4>
          </div>
          <div className="col-auto">
            <button
              className="btn btn-sm btn-primary"
              onClick={openAddModal}
              disabled={isLoading || isActionLoading}
            >
              <i className="fas fa-plus me-1"></i> Add Package
            </button>
          </div>
        </div>
      </div>
      <div className="card-body pt-0">
        {error &&
          !isModalOpen && ( // Display general error only if modal isn't open (modal handles its own)
            <div className="alert alert-danger mt-2" role="alert">
              <strong>Error:</strong> {error}
              <button
                onClick={() => {
                  fetchPackages();
                  setError(null);
                }}
                className="btn btn-sm btn-outline-danger ms-2 float-end"
              >
                Retry Fetch
              </button>
            </div>
          )}
        <PackageTable
          packages={packages}
          isLoading={isLoading && packages.length === 0}
          isActionLoading={isActionLoading}
          onEdit={openEditModal}
          onDelete={handleDeletePackage}
        />
      </div>
      <ManagePackageModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
        initialData={editingPackage}
        isSubmitting={isActionLoading} // Use isActionLoading for modal's submitting state
      />
    </div>
  );
};

export default PackageManagerWrapper;
