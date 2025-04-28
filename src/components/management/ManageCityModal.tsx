// src/components/management/ManageCityModal.tsx (Admin Panel)
import React, { useState, useEffect, useCallback } from "react";
import type { ICityAdminFE, ICityFormData } from "../../types";
// --- REMOVE Zod Imports ---
// import { createCitySchema } from '../../validators/citySchema'; // Assuming validator is copied to frontend
// import type { ZodIssue } from 'zod';
// --- End Removal ---

interface ManageCityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: ICityFormData, cityId?: string) => Promise<void>; // Async submit handler
  initialData: ICityAdminFE | null; // null for Add, city data for Edit
}

const ManageCityModal: React.FC<ManageCityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<ICityFormData>({ name: "" });
  // --- CHANGE: Use a single string for errors instead of object ---
  const [error, setError] = useState<string | null>(null);
  // --- End Change ---
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isEditMode = !!initialData;
  const modalTitle = isEditMode ? "Edit City" : "Add New City";

  // Effect to reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setFormData({ name: isEditMode ? initialData.name : "" });
      setError(null); // Clear errors when opening
      setIsSubmitting(false); // Reset submitting state
    }
  }, [isOpen, initialData, isEditMode]);

  // Handle input changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on change
    setError(null);
  }, []); // Removed errors dependency

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // --- REMOVE Zod Validation Block ---
    /*
    const validationResult = createCitySchema.safeParse(formData);
    if (!validationResult.success) {
      const fieldErrors: Record<string, string | undefined> = {};
      validationResult.error.issues.forEach((issue: ZodIssue) => {
        if (issue.path.length > 0) { fieldErrors[issue.path[0]] = issue.message; }
      });
      // Convert field errors to a single string or handle differently
      const firstErrorKey = Object.keys(fieldErrors)[0];
      setError(fieldErrors[firstErrorKey] || "Validation failed.");
      return;
    }
    // Use validationResult.data below if keeping Zod
    */
    // --- End Removal ---

    // --- Basic Frontend Check (Optional) ---
    if (!formData.name || formData.name.trim().length < 2) {
      setError("City name must be at least 2 characters long.");
      return;
    }
    // --- End Basic Check ---

    setIsSubmitting(true);
    try {
      // Call the onSubmit prop passed from the wrapper
      // Pass formData directly since Zod isn't used here
      await onSubmit(formData, initialData?._id);
      // Parent component (wrapper) should handle closing the modal on success
    } catch (apiError) {
      // If onSubmit throws, display the error
      console.error("API submission error:", apiError);
      setError((apiError as Error).message || "Failed to save city."); // Set single error string
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render null if modal is not open
  if (!isOpen) {
    return null;
  }

  return (
    // Basic Bootstrap Modal Structure
    <>
      <div
        className="modal-backdrop fade show"
        style={{ display: "block" }}
      ></div>
      <div
        className="modal fade show"
        tabIndex={-1}
        style={{ display: "block" }}
        aria-modal="true"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">{modalTitle}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  aria-label="Close"
                  disabled={isSubmitting}
                ></button>
              </div>
              <div className="modal-body">
                {/* Display general form error */}
                {error && (
                  <div className="alert alert-danger py-2">{error}</div>
                )}

                {/* City Name Input */}
                <div className="mb-3">
                  <label htmlFor="cityName" className="form-label">
                    City Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    // --- REMOVE is-invalid class logic based on Zod errors ---
                    className={`form-control`}
                    id="cityName"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required // Keep basic HTML required
                    disabled={isSubmitting}
                    // --- REMOVE aria-describedby based on Zod errors ---
                  />
                  {/* --- REMOVE Zod error display --- */}
                  {/* {errors.name && <div id="name-error" className="invalid-feedback">{errors.name}</div>} */}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-1"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Saving...
                    </>
                  ) : isEditMode ? (
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
    </>
  );
};

export default ManageCityModal;
