// src/components/management/ManageAddonModal.tsx
import React, { useState, useEffect, type FormEvent, forwardRef } from "react";
import Swal from "sweetalert2";

// Reuse the Addon interface
interface Addon {
  _id: string;
  name: string;
  price: number;
  image: string; // This will now directly hold the URL string
  createdAt: string;
  updatedAt: string;
}

interface ManageAddonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (addonData: Partial<Addon>) => Promise<void>;
  initialData: Addon | null;
  isLoading: boolean;
  apiError: string | null;
}

const ManageAddonModal = forwardRef<HTMLDivElement, ManageAddonModalProps>(
  ({ isOpen, onClose, onSubmit, initialData, isLoading, apiError }, ref) => {
    const [name, setName] = useState("");
    const [price, setPrice] = useState<number | "">("");
    // --- MODIFIED: State for image URL string ---
    const [imageUrl, setImageUrl] = useState<string>("");

    // Effect to populate form or reset
    useEffect(() => {
      if (initialData) {
        setName(initialData.name);
        setPrice(initialData.price);
        // --- MODIFIED: Set image URL state from initialData ---
        setImageUrl(initialData.image || ""); // Use existing image URL or empty string
      } else {
        setName("");
        setPrice("");

        setImageUrl("");
      }
    }, [initialData, isOpen]);

    const handleSubmit = async (event: FormEvent) => {
      event.preventDefault();

      if (!name || price === "" || Number(price) < 0) {
        Swal.fire(/* Validation Error */);
        return;
      }
      // Basic URL validation (optional but recommended)
      if (imageUrl && !/^https?:\/\/.+\..+/.test(imageUrl)) {
        Swal.fire(
          "Validation Error",
          "Please enter a valid image URL (starting with http:// or https://).",
          "warning"
        );
        return;
      }

      // Prepare data - include the imageUrl directly
      const addonData: Partial<Addon> = {
        _id: initialData?._id,
        name,
        price: Number(price),
        // --- MODIFIED: Use imageUrl state directly ---
        image: imageUrl,
      };

      // --- MODIFIED: Call onSubmit without imageFile ---
      await onSubmit(addonData);
    };

    // Always render the modal structure
    return (
      <div
        ref={ref}
        className={`modal fade`}
        id="addonModal" /* ... other attributes ... */
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                {/* ... title, close button ... */}
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
                  <div className="alert alert-danger">{apiError}</div>
                )}

                {/* Name Input (no change) */}
                <div className="mb-3">
                  <label htmlFor="addonName" className="form-label">
                    Addon Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="addonName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Price Input (no change) */}
                <div className="mb-3">
                  <label htmlFor="addonPrice" className="form-label">
                    Price <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    id="addonPrice"
                    value={price}
                    onChange={(e) =>
                      setPrice(
                        e.target.value === "" ? "" : parseFloat(e.target.value)
                      )
                    }
                    required
                    min="0"
                    step="0.01"
                    disabled={isLoading}
                  />
                </div>

                {/* --- MODIFIED: Image URL Input & Preview --- */}
                <div className="mb-3">
                  <label htmlFor="addonImageUrl" className="form-label">
                    Image URL
                  </label>
                  <input
                    type="text" // Changed type to text
                    className="form-control"
                    id="addonImageUrl"
                    placeholder="https://example.com/image.png"
                    value={imageUrl} // Bind value to imageUrl state
                    onChange={(e) => setImageUrl(e.target.value)} // Update imageUrl state
                    disabled={isLoading}
                  />
                  {/* Display preview if imageUrl is not empty */}
                  {imageUrl && (
                    <div className="mt-2">
                      <img
                        src={imageUrl} // Preview directly from URL state
                        alt="Preview"
                        style={{
                          maxWidth: "150px",
                          maxHeight: "150px",
                          objectFit: "contain",
                        }} // Adjusted preview size
                        // Optional: Add error handling for broken links
                        onError={(e) => {
                          console.warn(
                            "Failed to load image preview from URL:",
                            imageUrl
                          );
                        }}
                      />
                    </div>
                  )}
                </div>
                {/* --- End of Modified Section --- */}
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
                  Save
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
