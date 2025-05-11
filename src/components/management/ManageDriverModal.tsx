// src/components/management/ManageDriverModal.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";

// --- Component-Specific Interfaces ---
// (Copied from DriverManagerWrapper - for props and form data)
export interface Driver {
  id: string; // Corresponds to auth.users.id and drivers.id
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  vehicleNumber?: string | null;
  isActive: boolean;
  createdAt?: string; // Registration date from auth.users
}
// --- End Interface ---

export interface DriverFormData {
  email: string;
  password?: string; // Required for new, optional for update
  fullName: string; // Made non-optional for form
  phone: string; // Made non-optional for form
  vehicleNumber?: string | null; // Kept optional
  isActive: boolean;
}
// --- End Interfaces ---

interface ManageDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: DriverFormData) => Promise<void>; // Expects async, can throw error
  initialData: Driver | null;
}

const defaultFormData: DriverFormData = {
  email: "",
  fullName: "",
  phone: "",
  vehicleNumber: "",
  password: "",
  isActive: true, // Default new drivers to Active
};

const ManageDriverModal: React.FC<ManageDriverModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState<DriverFormData>(defaultFormData);
  const [error, setError] = useState<string | null>(null); // Local modal error
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isEditMode = useMemo(() => !!initialData, [initialData]);
  const modalTitle = useMemo(
    () => (isEditMode ? "Edit Driver" : "Add New Driver"),
    [isEditMode]
  );

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        setFormData({
          email: initialData.email || "", // Email should be present if editing
          fullName: initialData.fullName || "",
          phone: initialData.phone || "",
          vehicleNumber: initialData.vehicleNumber || "",
          isActive: initialData.isActive,
          password: "", // Always clear password on open for edit
        });
      } else {
        setFormData(defaultFormData);
      }
      setError(null);
      setIsSubmitting(false);
    }
  }, [initialData, isEditMode, isOpen]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!formData.fullName?.trim()) {
      setError("Full Name is required.");
      return;
    }
    if (!formData.phone?.trim()) {
      setError("Phone Number is required.");
      return;
    }
    // Password is required for new drivers
    if (!isEditMode && !formData.password?.trim()) {
      setError("Password is required for new drivers.");
      return;
    }
    if (formData.password && formData.password.length < 6) {
      // Supabase default min length
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData); // Parent (DriverManagerWrapper) handles actual API call & success
      // If onSubmit doesn't throw, it's considered a success by the wrapper
      // The wrapper will show notification and close modal.
    } catch (submitError: any) {
      console.error("Modal Submission Error caught by modal:", submitError);
      setError(
        submitError.message || "An unexpected error occurred during submission."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
                {error && (
                  <div className="alert alert-danger py-2" role="alert">
                    {error}
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="driverEmail" className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="driverEmail"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting || isEditMode} // Disable email edit for simplicity
                  />
                  {isEditMode && (
                    <div className="form-text">
                      Email cannot be changed after creation.
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="driverFullName" className="form-label">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="driverFullName"
                    name="fullName"
                    value={formData.fullName || ""}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="driverPhone" className="form-label">
                      Phone Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      id="driverPhone"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="driverVehicleNumber" className="form-label">
                      Vehicle No
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="driverVehicleNumber"
                      name="vehicleNumber"
                      value={formData.vehicleNumber || ""}
                      onChange={handleChange}
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
                      value={formData.password || ""}
                      onChange={handleChange}
                      required={!isEditMode}
                      placeholder={
                        isEditMode ? "To change, enter new" : "Min 6 characters"
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
                    <label htmlFor="driverIsActive" className="form-label">
                      Status <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="driverIsActive"
                      name="isActive"
                      value={formData.isActive ? "true" : "false"} // Select expects string values
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isActive: e.target.value === "true",
                        }))
                      }
                      required
                      disabled={isSubmitting}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
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
                  {isSubmitting
                    ? "Saving..."
                    : isEditMode
                    ? "Save Changes"
                    : "Create Driver"}
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
