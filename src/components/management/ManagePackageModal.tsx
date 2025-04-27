// src/components/management/ManagePackageModal.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { IPackageFE, IPackageFormData, ICategoryFE } from "../../types";
import { PackageType } from "../../types"; // Use standard import for runtime access
import { getAllCategories } from "../../services/packageService"; // Import category fetching function

// --- Component Props ---
interface ManagePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: IPackageFormData) => Promise<void>; // Expects an async function
  initialData: IPackageFE | null; // null for Add mode, package data for Edit mode
}

// --- Initial Form State ---
const defaultFormData: IPackageFormData = {
  name: "",
  description: "",
  price: 0,
  type: PackageType.MONTHLY, // Sensible default
  days: 30, // Sensible default
  category: "", // Requires selection
  image: "",
};

// --- The Component ---
const ManagePackageModal: React.FC<ManagePackageModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  // --- State ---
  const [formData, setFormData] = useState<IPackageFormData>(defaultFormData);
  const [categories, setCategories] = useState<ICategoryFE[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null); // For displaying submission/validation errors
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Internal loading state for submission

  // --- Memoized Values ---
  const isEditMode = useMemo(() => !!initialData, [initialData]);
  const modalTitle = useMemo(
    () => (isEditMode ? "Edit Package" : "Add New Package"),
    [isEditMode]
  );

  // --- Effects ---

  // Fetch Categories when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsCategoriesLoading(true);
      setError(null); // Clear previous errors related to categories or general modal state
      getAllCategories()
        .then((data) => {
          setCategories(data);
          // If adding a new package, ensure the default category selection is ''
          // If editing, ensure the current category still exists in the fetched list
          if (
            isEditMode &&
            initialData &&
            !data.some((c) => c._id === initialData.category._id)
          ) {
            // Category being edited might have been deleted, handle appropriately
            console.warn(
              "Initial category for editing not found in fetched list."
            );
            // Optionally set error or reset selection:
            // setError("The original category no longer exists.");
            setFormData((prev) => ({ ...prev, category: "" }));
          } else if (!isEditMode) {
            setFormData((prev) => ({ ...prev, category: "" })); // Ensure default is blank for 'Add'
          }
        })
        .catch((err) => {
          console.error("Failed to fetch categories:", err);
          setError(`Could not load categories: ${(err as Error).message}`);
          setCategories([]); // Ensure categories array is empty on error
        })
        .finally(() => {
          setIsCategoriesLoading(false);
        });
    }
  }, [isOpen, isEditMode, initialData]); // Dependencies ensure refetch if modal reopens in different mode

  // Populate/Reset Form based on Mode and Open State
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        // Populate form for Edit mode
        setFormData({
          name: initialData.name,
          description: initialData.description || "",
          price: initialData.price,
          type: initialData.type,
          days: initialData.days,
          category: initialData.category._id, // Pre-select category ID
          image: initialData.image || "",
        });
      } else {
        // Reset form for Add mode
        setFormData(defaultFormData);
      }
      // Clear submission errors when modal opens/changes mode
      // Keep category loading errors if they occurred during this open cycle
      if (!error?.includes("categories")) {
        setError(null);
      }
    }
    // We don't necessarily want to reset the form when isOpen becomes false,
    // as the close animation might still be happening. Reset happens on re-open.
  }, [initialData, isEditMode, isOpen, error]); // Added 'error' dependency to help clear non-category errors

  // --- Handlers ---

  // Generic input change handler
  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value, type } = e.target;

      // Basic type handling for number inputs
      let processedValue: string | number = value;
      if (type === "number") {
        processedValue = value === "" ? "" : parseFloat(value); // Keep empty string for clearing input, parse otherwise
        if (isNaN(processedValue as number)) {
          processedValue = 0; // Default to 0 if parsing fails
        }
      }

      setFormData((prev) => ({
        ...prev,
        [name]: processedValue,
      }));
    },
    []
  );

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // --- Client-Side Validation ---
    if (!formData.name.trim()) {
      setError("Package Name is required.");
      return;
    }
    // Check if price is a valid positive number
    if (typeof formData.price !== "number" || formData.price <= 0) {
      setError("Price must be a positive number.");
      return;
    }
    // Check if days is a valid positive integer
    if (
      typeof formData.days !== "number" ||
      formData.days <= 0 ||
      !Number.isInteger(formData.days)
    ) {
      setError("Duration (Days) must be a positive whole number.");
      return;
    }
    if (!formData.category) {
      setError("Please select a Category.");
      return;
    }
    // Optional: More robust URL validation if needed
    if (formData.image && !/^(https?:\/\/)/.test(formData.image)) {
      setError("Image URL must start with http:// or https://");
      return;
    }
    // --- End Validation ---

    setIsSubmitting(true);
    try {
      // Create a deep copy to prevent potential mutations if needed elsewhere
      const submissionData = { ...formData };
      await onSubmit(submissionData); // Call the async onSubmit passed from parent
      // Success: Parent's onSubmit should handle closing the modal or displaying success message
    } catch (submitError) {
      // If onSubmit prop throws an error (e.g., API failure was caught and re-thrown by parent), display it
      console.error("Submission Error:", submitError);
      setError(
        (submitError as Error).message ||
          "An unexpected error occurred during submission."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Logic ---
  if (!isOpen) {
    return null; // Don't render anything if modal is closed
  }

  // Render the modal using Bootstrap structure and classes
  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        onClick={!isSubmitting ? onClose : undefined}
      ></div>

      {/* Modal Dialog */}
      <div
        className="modal fade show"
        tabIndex={-1}
        style={{ display: "block" }}
        aria-modal="true"
        role="dialog"
      >
        {/* Using modal-lg for potentially wider content, adjust as needed */}
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
          <div className="modal-content">
            {/* Form wraps the whole content for submission */}
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">{modalTitle}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose} // Use onClose prop
                  aria-label="Close"
                  disabled={isSubmitting} // Disable close button during submission
                ></button>
              </div>
              <div className="modal-body">
                {/* Error Display Area */}
                {error && (
                  <div
                    className="alert alert-danger d-flex align-items-center py-2"
                    role="alert"
                  >
                    {/* Optional: Add an icon (requires Font Awesome or similar) */}
                    {/* <i className="fas fa-exclamation-triangle me-2"></i> */}
                    <div>{error}</div>
                  </div>
                )}

                {/* Form Fields - Using Bootstrap layout */}
                <div className="mb-3">
                  <label htmlFor="packageName" className="form-label">
                    Package Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${
                      error && !formData.name.trim() ? "is-invalid" : ""
                    }`}
                    id="packageName"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    maxLength={100} // Example max length
                    disabled={isSubmitting}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="packageDescription" className="form-label">
                    Description
                  </label>
                  <textarea
                    className="form-control"
                    id="packageDescription"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    maxLength={500} // Example max length
                    disabled={isSubmitting}
                  ></textarea>
                </div>

                <div className="row g-3 mb-3">
                  {" "}
                  {/* Use row with gutters and bottom margin */}
                  <div className="col-md-6">
                    <label htmlFor="packagePrice" className="form-label">
                      Price ($) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className={`form-control ${
                        error &&
                        (typeof formData.price !== "number" ||
                          formData.price <= 0)
                          ? "is-invalid"
                          : ""
                      }`}
                      id="packagePrice"
                      name="price"
                      value={formData.price === 0 ? "" : formData.price} // Show empty string for 0 for better UX
                      onChange={handleChange}
                      required
                      min="0.01"
                      step="0.01"
                      placeholder="e.g., 19.99"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="packageDays" className="form-label">
                      Duration (Days) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className={`form-control ${
                        error &&
                        (typeof formData.days !== "number" ||
                          formData.days <= 0 ||
                          !Number.isInteger(formData.days))
                          ? "is-invalid"
                          : ""
                      }`}
                      id="packageDays"
                      name="days"
                      value={formData.days === 0 ? "" : formData.days} // Show empty string for 0
                      onChange={handleChange}
                      required
                      min="1"
                      step="1"
                      placeholder="e.g., 7 or 30"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="packageType" className="form-label">
                      Package Type <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="packageType"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                    >
                      {/* Map through PackageType enum values */}
                      {Object.values(PackageType).map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="packageCategory" className="form-label">
                      Category <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`form-select ${
                        error && !formData.category ? "is-invalid" : ""
                      }`}
                      id="packageCategory"
                      name="category"
                      value={formData.category} // Bind to category ID in state
                      onChange={handleChange}
                      required
                      disabled={
                        isSubmitting ||
                        isCategoriesLoading ||
                        categories.length === 0
                      }
                    >
                      <option value="" disabled>
                        {/* Show appropriate text based on loading/error/empty state */}
                        {isCategoriesLoading
                          ? "Loading Categories..."
                          : categories.length === 0
                          ? "No Categories Found"
                          : "-- Select Category --"}
                      </option>
                      {/* Map through fetched categories */}
                      {!isCategoriesLoading &&
                        categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="packageImage" className="form-label">
                    Image URL
                  </label>
                  <input
                    type="url"
                    className={`form-control ${
                      error &&
                      formData.image &&
                      !/^(https?:\/\/)/.test(formData.image)
                        ? "is-invalid"
                        : ""
                    }`}
                    id="packageImage"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    disabled={isSubmitting}
                  />
                  <div className="form-text">
                    Optional: Provide a direct URL to the package image.
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isSubmitting} // Disable during submission
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || isCategoriesLoading} // Disable if submitting or categories still loading
                >
                  {/* Show dynamic text based on state */}
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
                    "Create Package"
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

export default ManagePackageModal;
