// src/components/management/AddonManagerWrapper.tsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import Swal from "sweetalert2";
import { supabase } from "../../lib/supabaseClient"; // Your Supabase client
import AddonTable, { type AddonTableHandle } from "./AddonTable";
import ManageAddonModal from "./ManageAddonModal";
import type { Addon } from "../../types"; // Assuming types are in src/types
import { HiOutlinePlus } from "react-icons/hi2";

const AddonManagerWrapper: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAddon, setCurrentAddon] = useState<Addon | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For modal submission loading
  const [modalApiError, setModalApiError] = useState<string | null>(null); // For errors specific to modal submission

  const addonTableRef = useRef<AddonTableHandle>(null);

  // For Bootstrap modal instance management (Vanilla JS Bootstrap)
  const modalElementRef = useRef<HTMLDivElement | null>(null);
  const modalInstanceRef = useRef<any>(null); // Stores Bootstrap Modal instance
  const isModalProgrammaticallyOpenedRef = useRef(false); // To help manage Bootstrap events

  const getModalInstance = useCallback(() => {
    if (modalElementRef.current) {
      if (!modalInstanceRef.current) {
        // Initialize if not already
        modalInstanceRef.current = new (window as any).bootstrap.Modal(
          modalElementRef.current
        );
      }
      return modalInstanceRef.current;
    }
    return null;
  }, []);

  const handleOpenAddModal = useCallback(() => {
    setCurrentAddon(null);
    setModalApiError(null);
    setIsModalOpen(true); // Trigger React state change
    isModalProgrammaticallyOpenedRef.current = true;
  }, []);

  const handleOpenEditModal = useCallback((addon: Addon) => {
    setCurrentAddon(addon);
    setModalApiError(null);
    setIsModalOpen(true); // Trigger React state change
    isModalProgrammaticallyOpenedRef.current = true;
  }, []);

  const handleCloseModal = useCallback(() => {
    // This function is primarily to be called by UI elements *inside* the modal
    // or by logic that wants to ensure the modal is told to hide.
    const instance = getModalInstance();
    instance?.hide(); // Tell Bootstrap to hide. Event listener will sync React state.
  }, [getModalInstance]);

  // Effect to show/hide Bootstrap modal based on React state
  useEffect(() => {
    const instance = getModalInstance();
    if (isModalOpen) {
      if (isModalProgrammaticallyOpenedRef.current) {
        // Only show if React initiated it
        instance?.show();
        isModalProgrammaticallyOpenedRef.current = false; // Reset flag
      }
    } else {
      // If React state `isModalOpen` is false, ensure Bootstrap modal is hidden.
      // This handles cases where modal might be closed externally to handleCloseModal.
      // instance?.hide(); // This can cause issues if modal is already hiding.
      // The 'hide.bs.modal' listener is generally better for syncing React state *from* Bootstrap.
    }
  }, [isModalOpen, getModalInstance]);

  // Effect for Bootstrap modal event listeners
  useEffect(() => {
    const modalEl = modalElementRef.current;
    if (!modalEl) return;

    // Initialize instance when element is available
    getModalInstance();

    const handleBootstrapModalHide = () => {
      // Sync React state when Bootstrap modal is hidden (e.g., by ESC key, backdrop click)
      if (isModalOpen) {
        // Only update if React thinks it's open
        setIsModalOpen(false);
        setCurrentAddon(null); // Clear editing state
        setModalApiError(null); // Clear modal-specific errors
      }
    };

    modalEl.addEventListener("hide.bs.modal", handleBootstrapModalHide);
    return () => {
      modalEl.removeEventListener("hide.bs.modal", handleBootstrapModalHide);
      // Optional: Dispose Bootstrap modal instance if component unmounts
      // modalInstanceRef.current?.dispose();
      // modalInstanceRef.current = null;
    };
  }, [isModalOpen, getModalInstance]); // Re-attach if isModalOpen changes (though typically modalEl is stable)

  const handleSaveAddon = useCallback(
    async (addonData: Partial<Addon>, isUpdating: boolean) => {
      setIsLoading(true);
      setModalApiError(null);

      try {
        let data: Addon | null = null;
        let error: any = null;

        const dataToSave = {
          name: addonData.name,
          price: addonData.price,
          image_url: addonData.image_url || null, // Ensure null if empty
        };

        if (isUpdating && addonData.id) {
          // UPDATE
          const { data: updateData, error: updateError } = await supabase
            .from("addons")
            .update(dataToSave)
            .eq("id", addonData.id)
            .select()
            .single(); // Assuming you want the updated row back
          data = updateData;
          error = updateError;
        } else {
          // CREATE
          const { data: createData, error: createError } = await supabase
            .from("addons")
            .insert(dataToSave)
            .select()
            .single(); // Assuming you want the created row back
          data = createData;
          error = createError;
        }

        if (error) throw error;

        if (data) {
          Swal.fire(
            isUpdating ? "Updated!" : "Created!",
            `Addon ${data.name} has been ${
              isUpdating ? "updated" : "created"
            } successfully.`,
            "success"
          );
          handleCloseModal(); // Programmatically tell Bootstrap modal to hide
          addonTableRef.current?.refetch();
        } else {
          throw new Error(
            "Operation completed but no data returned from the database."
          );
        }
      } catch (error: any) {
        console.error("Save Addon Error:", error);
        const message =
          error.message ||
          `Failed to ${isUpdating ? "update" : "create"} addon.`;
        setModalApiError(message); // Show error in the modal
        // Optionally, you can re-throw or show a Swal for errors not caught by modal display
        // Swal.fire("Operation Failed", message, "error");
      } finally {
        setIsLoading(false);
      }
    },
    [handleCloseModal] // Dependencies for useCallback
  );

  return (
    <div className="card">
      <div className="card-header">
        <div className="row align-items-center">
          <div className="col">
            <h4 className="card-title">Manage Addons</h4>
          </div>
          <div className="col-auto">
            <button
              id="add-addon-button" // Keep ID if other parts of your app use it
              className="btn btn-sm btn-primary d-flex align-items-center"
              onClick={handleOpenAddModal}
            >
              <HiOutlinePlus size={18} className="me-1" /> Add Addon
            </button>
          </div>
        </div>
      </div>
      <div className="card-body pt-0">
        {/* AddonTable will show its own loading/error states for fetching */}
        <AddonTable ref={addonTableRef} onEdit={handleOpenEditModal} />
      </div>

      <ManageAddonModal
        ref={modalElementRef} // Pass the ref for Bootstrap instance management
        isOpen={isModalOpen}
        onClose={handleCloseModal} // This will call instance.hide()
        onSubmit={handleSaveAddon}
        initialData={currentAddon}
        isLoading={isLoading} // For modal submission spinner
        apiError={modalApiError} // For errors within the modal
      />
    </div>
  );
};

export default AddonManagerWrapper;
