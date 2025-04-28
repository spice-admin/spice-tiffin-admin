// src/components/management/ManageDriverModal.tsx

import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { IDriverFE, IDriverFormData } from "../../types"; // Adjust path

// --- Component Props ---
interface ManageDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: IDriverFormData) => Promise<any>; // Expects async, can throw error
  initialData: IDriverFE | null; // null for Add, driver data for Edit
}

// --- Initial Form State ---
const defaultFormData: IDriverFormData = {
  fullName: "",
  phone: "",
  vehicleNumber: "",
  password: "", // Keep password field, make optional in edit
  status: "Active", // Default status
};

const ManageDriverModal: React.FC<ManageDriverModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  // --- State ---
  const [formData, setFormData] = useState<IDriverFormData>(defaultFormData);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // --- Memoized Values ---
  const isEditMode = useMemo(() => !!initialData, [initialData]);
  const modalTitle = useMemo(
    () => (isEditMode ? "Edit Driver" : "Add New Driver"),
    [isEditMode]
  );

  // --- Effects ---
  // Populate/Reset Form based on Mode and Open State
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        // Populate form for Edit mode, EXCLUDING password
        setFormData({
          fullName: initialData.fullName,
          phone: initialData.phone,
          vehicleNumber: initialData.vehicleNumber,
          status: initialData.status,
          password: "", // ALWAYS leave password blank in edit form initially
        });
      } else {
        // Reset form for Add mode
        setFormData(defaultFormData);
      }
      // Clear previous submission errors when modal opens/changes mode
      setError(null);
      setIsSubmitting(false); // Ensure submitting state is reset
    }
  }, [initialData, isEditMode, isOpen]);

  // --- Handlers ---
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // --- Client-Side Validation ---
    if (!formData.fullName.trim()) {
      setError("Full Name is required.");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Phone Number is required.");
      return;
    }
    if (!formData.vehicleNumber.trim()) {
      setError("Vehicle Number is required.");
      return;
    }
    // Password is required ONLY when adding a new driver
    if (!isEditMode && !formData.password?.trim()) {
      setError("Password is required for new drivers.");
      return;
    }
    if (formData.password && formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    // --- End Validation ---

    setIsSubmitting(true);
    try {
      await onSubmit(formData); // Call the async onSubmit passed from parent
      // Parent (Wrapper) handles success (closing modal, showing notification)
    } catch (submitError: any) {
      // If onSubmit prop throws/returns an error, display it in the modal
      console.error("Modal Submission Error caught:", submitError);
      setError(submitError.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---
  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal-backdrop fade show"
        onClick={!isSubmitting ? onClose : undefined}
      ></div>
      <div
        className="modal fade show"
        tabIndex={-1}
        style={{ display: "block" }}
        aria-modal="true"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          {" "}
          {/* Standard size */}
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
                {/* Error Display */}
                {error && (
                  <div className="alert alert-danger py-2" role="alert">
                    {error}
                  </div>
                )}

                {/* Form Fields */}
                <div className="mb-3">
                  <label htmlFor="driverFullName" className="form-label">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="driverFullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="driverPhone" className="form-label">
                      Phone Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel" // Use type="tel" for phone numbers
                      className="form-control"
                      id="driverPhone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      maxLength={20}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="driverVehicleNumber" className="form-label">
                      Vehicle No <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="driverVehicleNumber"
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={handleChange}
                      required
                      maxLength={20}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="driverPassword" className="form-label">
                      Password{" "}
                      {!isEditMode && <span className="text-danger">*</span>}
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="driverPassword"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      minLength={8}
                      required={!isEditMode} // Required only in Add mode
                      placeholder={
                        isEditMode
                          ? "Enter new password to change"
                          : "Min 8 characters"
                      }
                      disabled={isSubmitting}
                    />
                    {isEditMode && (
                      <div className="form-text">
                        Leave blank to keep current password.
                      </div>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="driverStatus" className="form-label">
                      Status <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="driverStatus"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Saving...
                    </>
                  ) : isEditMode ? (
                    "Save Changes"
                  ) : (
                    "Create Driver"
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

export default ManageDriverModal;
