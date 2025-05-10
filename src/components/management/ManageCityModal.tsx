// src/components/management/ManageCityModal.tsx
import React, { useState, useEffect } from "react";
import type { City, CityFormData } from "../../types"; // Import your types

interface ManageCityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: CityFormData, cityId?: string) => Promise<void>;
  initialData?: City | null; // City type
  isActionLoading: boolean;
}

const ManageCityModal: React.FC<ManageCityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isActionLoading,
}) => {
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
    } else {
      setName(""); // Reset for "Add" mode
    }
    setFormError(null); // Reset error when initialData or isOpen changes
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("City name cannot be empty.");
      return;
    }
    try {
      await onSubmit({ name: name.trim() }, initialData?.id);
    } catch (error: any) {
      setFormError(error.message || "An error occurred.");
      // Don't close modal on error, so user can see message and correct.
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal fade show" // 'show' class makes it visible
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }} // Basic modal styling
      id="cityModal"
      tabIndex={-1}
      aria-labelledby="cityModalLabel"
      aria-modal="true" // Mark as modal
      role="dialog" // ARIA role
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title" id="cityModalLabel">
                {initialData ? "Edit City" : "Add New City"}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
                disabled={isActionLoading}
              ></button>
            </div>
            <div className="modal-body">
              {formError && (
                <div className="alert alert-danger" role="alert">
                  {formError}
                </div>
              )}
              <div className="mb-3">
                <label htmlFor="cityName" className="form-label">
                  City Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="cityName"
                  placeholder="Enter city name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isActionLoading}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isActionLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Saving...
                  </>
                ) : initialData ? (
                  "Save Changes"
                ) : (
                  "Add City"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManageCityModal;
