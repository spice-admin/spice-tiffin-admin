// src/components/management/AddonManagerWrapper.tsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import Swal from "sweetalert2";

import AddonTable, { type AddonTableHandle } from "./AddonTable"; // Import table and its handle
import ManageAddonModal from "./ManageAddonModal"; // Import modal

// Define Addon type again or import from a shared types file
interface Addon {
  _id: string;
  name: string;
  price: number;
  image: string;
  createdAt: string;
  updatedAt: string;
}

const AddonManagerWrapper: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAddon, setCurrentAddon] = useState<Addon | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const addonTableRef = useRef<AddonTableHandle>(null);
  const modalElementRef = useRef<HTMLDivElement | null>(null);
  const modalInstanceRef = useRef<any>(null);
  const isModalOpenRef = useRef(isModalOpen);

  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]); // Keep this ref sync

  const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL;

  // --- FIX 1: Callback ref function to get modal DOM element ---
  // Renamed for clarity, passed to ManageAddonModal's ref prop
  const modalRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      modalElementRef.current = node;
      // Initialize Bootstrap instance here if it doesn't exist,
      // or ensure getModalInstance creates it when needed.
      getModalInstance(); // Ensure instance is created once node is available
    } else {
      // Optional: Cleanup if modal node is removed
      // modalInstanceRef.current?.dispose();
      // modalInstanceRef.current = null;
      modalElementRef.current = null;
    }
  }, []); // Add getModalInstance to dependencies if needed, check below

  // Get or create the Bootstrap Modal instance
  const getModalInstance = useCallback(() => {
    const element = modalElementRef.current;
    if (element) {
      // Use Bootstrap's static method to get existing instance or create new
      // This prevents creating multiple instances for the same element
      modalInstanceRef.current = (
        window as any
      ).bootstrap.Modal.getOrCreateInstance(element);
      return modalInstanceRef.current;
    }
    return null;
  }, []); // Depends only on modalElementRef.current availability

  // --- FIX 2: Function to open modal for ADDING ---
  const handleOpenAddModal = useCallback(() => {
    setCurrentAddon(null); // Set for Add mode
    setApiError(null);
    setIsModalOpen(true); // Update React state -> triggers useEffect to show
  }, []); // No dependencies needed

  // Function to open modal for editing
  const handleOpenEditModal = useCallback((addon: Addon) => {
    setCurrentAddon(addon); // Set for Edit mode
    setApiError(null);
    setIsModalOpen(true); // Update React state -> triggers useEffect to show
  }, []); // No dependencies needed

  // Function to close the modal (called by UI buttons or logic)
  const handleCloseModal = useCallback(() => {
    const instance = getModalInstance();
    instance?.hide(); // Tell Bootstrap to hide
    // Actual state update (isModalOpen=false) happens via the 'hide.bs.modal' listener
  }, [getModalInstance]);

  // Function to handle saving (Create or Update)
  const handleSaveAddon = useCallback(
    async (addonData: Partial<Addon>) => {
      setIsLoading(true);
      setApiError(null);
      // NOTE: finalImageUrl logic was removed in previous step assuming URL comes directly in addonData.image
      // If you need to handle image upload logic, it should be re-introduced here.

      const isUpdating = !!currentAddon?._id; // Determine if updating *before* try block

      try {
        // 1. Prepare data for API
        // Ensure required fields from addonData are present before sending
        if (
          !addonData.name ||
          addonData.price === undefined ||
          addonData.price === null
        ) {
          throw new Error("Missing required addon data (name or price).");
        }

        const dataToSend = {
          name: addonData.name,
          price: Number(addonData.price), // Ensure price is sent as a number
          image: addonData.image || "", // Use provided URL or default to empty string
        };

        // 2. Determine API endpoint and method
        const url = isUpdating
          ? `${API_BASE_URL}/addons/${currentAddon._id}`
          : `${API_BASE_URL}/addons`;
        const method = isUpdating ? "PUT" : "POST";

        // 3. Make API Call
        console.log(
          `Sending ${method} request to ${url} with data:`,
          dataToSend
        ); // Log request details
        const response = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            // Add Auth headers if needed, e.g.:
            // 'Authorization': `Bearer ${your_auth_token_variable}`
          },
          body: JSON.stringify(dataToSend),
        });

        // 4. Parse API Response
        const result = await response.json();
        console.log(`Received response from ${method} ${url}:`, {
          status: response.status,
          ok: response.ok,
          body: result,
        }); // Log response details

        // 5. Handle API Response
        if (response.ok && result.success) {
          // --- Success Path ---
          const successTitle = isUpdating ? "Updated!" : "Created!";
          const successMessage =
            result?.message ||
            `Addon ${isUpdating ? "updated" : "created"} successfully.`;

          Swal.fire(
            successTitle,
            successMessage || "Operation successful!", // Add extra fallback
            "success"
          );
          handleCloseModal(); // Close modal on success
          addonTableRef.current?.refetch(); // Refetch table data
        } else {
          // --- API Error Path (e.g., 4xx, 5xx with success: false) ---
          // Extract error message from backend response (keep existing good logic)
          const errorMessage =
            result?.message ||
            (Array.isArray(result?.errors)
              ? result.errors
                  .map(
                    (e: any) => `${e.path?.join(".") || "Error"}: ${e.message}`
                  )
                  .join("\n") // Improved Zod-like error formatting
              : `API Error: Status ${response.status}`); // Fallback using status code

          console.error(
            `API Error (${method} ${url}): Status ${response.status}`,
            result
          ); // Log the API error details
          setApiError(errorMessage); // Set error state to display in the modal

          // Optionally show a generic Swal for non-validation server errors
          if (response.status >= 500) {
            // Show Swal only for server errors (5xx)
            Swal.fire(
              "Server Error",
              `Failed to ${
                isUpdating ? "update" : "create"
              } addon. ${errorMessage}`,
              "error"
            );
          } else if (response.status === 409) {
            // Conflict (e.g., duplicate name)
            // Error already set via setApiError for modal, maybe no Swal needed
            // Or show specific Swal: Swal.fire('Conflict', errorMessage, 'warning');
          } else if (response.status === 400) {
            // Validation error
            // Error already set via setApiError for modal, no Swal needed
          } else {
            // Other client errors (401, 403, 404 etc.)
            Swal.fire("Operation Failed", errorMessage, "error");
          }
        }
      } catch (error: any) {
        // --- Network or other unexpected error Path ---
        console.error(
          // Fill console error with context
          `❌ Network/Catch Error during ${
            isUpdating ? "update" : "create"
          } addon:`,
          error
        );
        // Extract message (keep existing good logic)
        const message =
          error?.message ||
          `Failed to connect or perform operation. Please try again.`;
        setApiError(message); // Show error in the modal
        Swal.fire("Network Error", message, "error"); // Show Swal for network/catch errors
      } finally {
        setIsLoading(false); // Ensure loading state is always turned off
      }
    },
    // Updated dependencies - include state setters used within the function
    [
      API_BASE_URL,
      currentAddon,
      handleCloseModal,
      setIsLoading,
      setApiError,
      addonTableRef,
    ]
  );

  // Effect to programmatically show Bootstrap modal when React state changes
  useEffect(() => {
    if (isModalOpen) {
      const instance = getModalInstance();
      instance?.show();
    }
    // We don't call hide() here; handleCloseModal or the event listener does that
  }, [isModalOpen, getModalInstance]); // Re-run when isOpen changes or instance getter changes

  // Effect to set up event listeners for the modal hide event and the add button click
  useEffect(() => {
    const modalEl = modalElementRef.current;
    const addBtn = document.getElementById("add-addon-button");

    // Listener for Bootstrap hide event to sync React state back
    const handleHideEvent = () => {
      // Check React state BEFORE updating to prevent potential loops
      if (isModalOpenRef.current) {
        setIsModalOpen(false);
        setCurrentAddon(null);
        setApiError(null);
      }
    };

    // --- FIX 3: Correct Add Button Click Handler ---
    const handleAddClick = () => {
      handleOpenAddModal(); // Call the correct function for adding
    };

    if (modalEl) {
      modalEl.addEventListener("hide.bs.modal", handleHideEvent);
      // Ensure instance exists if modalEl exists
      getModalInstance();
    }
    if (addBtn) {
      addBtn.addEventListener("click", handleAddClick);
    }

    // Cleanup function
    return () => {
      if (modalEl) {
        modalEl.removeEventListener("hide.bs.modal", handleHideEvent);
      }
      if (addBtn) {
        addBtn.removeEventListener("click", handleAddClick);
      }
    };
  }, [handleOpenAddModal, getModalInstance]); // Add handleOpenAddModal dependency

  return (
    <div>
      <AddonTable ref={addonTableRef} onEdit={handleOpenEditModal} />

      <ManageAddonModal
        ref={modalRefCallback}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSaveAddon}
        initialData={currentAddon}
        isLoading={isLoading}
        apiError={apiError}
      />
    </div>
  );
};

export default AddonManagerWrapper;
