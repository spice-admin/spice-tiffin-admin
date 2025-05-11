// src/components/management/ManageAddonModal.tsx
import React, { useState, useEffect, type FormEvent, forwardRef } from "react";
import Swal from "sweetalert2";
import type { Addon, AddonFormData as LocalAddonFormData } from "../../types"; // Assuming types are in src/types

interface ManageAddonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (addonData: Partial<Addon>, isUpdating: boolean) => Promise<void>; // Pass isUpdating
  initialData: Addon | null;
  isLoading: boolean;
  apiError: string | null; // Error from Supabase operations
}

const ManageAddonModal = forwardRef<HTMLDivElement, ManageAddonModalProps>(
  ({ isOpen, onClose, onSubmit, initialData, isLoading, apiError }, ref) => {
    const [name, setName] = useState("");
    const [price, setPrice] = useState<number | "">("");
    const [imageUrl, setImageUrl] = useState<string>(""); // For image_url

    useEffect(() => {
      if (isOpen) {
        // Only update form when modal becomes visible or initialData changes
        if (initialData) {
          setName(initialData.name);
          setPrice(initialData.price);
          setImageUrl(initialData.image_url || ""); // Use image_url
        } else {
          setName("");
          setPrice("");
          setImageUrl("");
        }
      }
    }, [initialData, isOpen]);

    const handleSubmit = async (event: FormEvent) => {
      event.preventDefault();

      if (!name.trim() || price === "" || Number(price) < 0) {
        Swal.fire(
          "Validation Error",
          "Addon Name and a valid Price (0 or more) are required.",
          "warning"
        );
        return;
      }
      if (imageUrl && !/^https?:\/\/.+\..+/.test(imageUrl)) {
        Swal.fire(
          "Validation Error",
          "Please enter a valid image URL (starting with http:// or https://).",
          "warning"
        );
        return;
      }

      const addonSubmitData: Partial<Addon> = {
        name: name.trim(),
        price: Number(price),
        image_url: imageUrl.trim() || null, // Send null if empty, Supabase handles this well
      };

      // If updating, include the id
      if (initialData?.id) {
        addonSubmitData.id = initialData.id;
      }

      await onSubmit(addonSubmitData, !!initialData?.id);
    };

    return (
      <div
        ref={ref} // This ref is for the Bootstrap modal instance management by parent
        className={`modal fade`} // isOpen state in parent will control Bootstrap's show/hide
        id="addonManagementModal" // Ensure this ID is unique if you have multiple modals
        tabIndex={-1}
        aria-labelledby="addonModalLabel"
        aria-hidden={!isOpen} // For accessibility, controlled by isOpen prop
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title" id="addonModalLabel">
                  {initialData ? "Edit Addon" : "Add New Addon"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  aria-label="Close"
                  disabled={isLoading}
                ></button>
              </div>
              <div className="modal-body">
                {apiError && (
                  <div className="alert alert-danger py-2" role="alert">
                    {apiError}
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="addonNameModal" className="form-label">
                    Addon Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="addonNameModal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="addonPriceModal" className="form-label">
                    Price <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="addonPriceModal"
                    value={price}
                    onChange={(e) =>
                      setPrice(
                        e.target.value === "" ? "" : parseFloat(e.target.value)
                      )
                    }
                    required
                    min="0"
                    step="0.01" // Or your desired step
                    disabled={isLoading}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="addonImageUrlModal" className="form-label">
                    Image URL
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="addonImageUrlModal"
                    placeholder="https://example.com/image.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={isLoading}
                  />
                  {imageUrl && ( // Simple preview
                    <div className="mt-2">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        style={{
                          maxWidth: "100px",
                          maxHeight: "100px",
                          objectFit: "contain",
                        }}
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        } // Hide if image link is broken
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Saving..."
                    : initialData
                    ? "Save Changes"
                    : "Create Addon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
);

export default ManageAddonModal;
