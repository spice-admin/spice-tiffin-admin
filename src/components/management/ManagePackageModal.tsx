import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path
import type {
  Package,
  PackageFormData,
  CategoryBasic,
  PackageType as PackageTypeValue,
} from "../../types"; // Adjust path
import { PackageType } from "../../types"; // For enum values

interface ManagePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: PackageFormData, packageId?: string) => Promise<void>;
  initialData: Package | null;
  isSubmitting: boolean; // Changed from isLoading to isSubmitting for clarity
}

const defaultFormData: PackageFormData = {
  name: "",
  description: "",
  price: "", // Start with empty string for input
  type: PackageType.MONTHLY,
  days: "", // Start with empty string for input
  category: "", // Will hold category_id
  image_url: "",
  is_active: true,
};

const ManagePackageModal: React.FC<ManagePackageModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState<PackageFormData>(defaultFormData);
  const [categories, setCategories] = useState<CategoryBasic[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = useMemo(() => !!initialData, [initialData]);
  const modalTitle = useMemo(
    () => (isEditMode ? "Edit Package" : "Add New Package"),
    [isEditMode]
  );

  useEffect(() => {
    if (isOpen) {
      setIsCategoriesLoading(true);
      setError(null);
      supabase
        .from("categories")
        .select("id, name")
        .order("name", { ascending: true })
        .then(({ data, error: categoriesError }) => {
          if (categoriesError) {
            console.error("Failed to fetch categories:", categoriesError);
            setError(`Could not load categories: ${categoriesError.message}`);
            setCategories([]);
          } else {
            setCategories(data || []);
          }
          setIsCategoriesLoading(false);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        setFormData({
          name: initialData.name,
          description: initialData.description || "",
          price: initialData.price,
          type: initialData.type,
          days: initialData.days,
          category: initialData.category_id || initialData.categories?.id || "",
          image_url: initialData.image_url || "",
          is_active:
            initialData.is_active !== undefined ? initialData.is_active : true,
        });
      } else {
        setFormData(defaultFormData);
      }
      setError(null);
    }
  }, [initialData, isEditMode, isOpen]);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked; // For checkbox

      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : type === "number" && value === ""
            ? ""
            : type === "number"
            ? parseFloat(value)
            : value,
      }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Package Name is required.");
      return;
    }
    if (formData.price === "" || Number(formData.price) <= 0) {
      setError("Price must be a positive number.");
      return;
    }
    if (
      formData.days === "" ||
      Number(formData.days) <= 0 ||
      !Number.isInteger(Number(formData.days))
    ) {
      setError("Duration (Days) must be a positive whole number.");
      return;
    }
    if (!formData.category) {
      setError("Please select a Category.");
      return;
    }
    if (formData.image_url && !/^(https?:\/\/)/.test(formData.image_url)) {
      setError("Image URL must be a valid URL (http:// or https://).");
      return;
    }

    // Ensure numeric fields are numbers before submission
    const finalFormData: PackageFormData = {
      ...formData,
      price: Number(formData.price),
      days: Number(formData.days),
    };

    try {
      await onSubmit(finalFormData, initialData?.id);
    } catch (submitError: any) {
      setError(submitError.message || "Submission failed.");
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
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
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
                  <label htmlFor="packageName" className="form-label">
                    Package Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="packageName"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    maxLength={100}
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
                    maxLength={500}
                    disabled={isSubmitting}
                  ></textarea>
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="packagePrice" className="form-label">
                      Price ($) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="packagePrice"
                      name="price"
                      value={formData.price}
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
                      className="form-control"
                      id="packageDays"
                      name="days"
                      value={formData.days}
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
                      className="form-select"
                      id="packageCategory"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      disabled={
                        isSubmitting ||
                        isCategoriesLoading ||
                        categories.length === 0
                      }
                    >
                      <option value="" disabled>
                        {isCategoriesLoading
                          ? "Loading..."
                          : categories.length === 0
                          ? "No Categories"
                          : "-- Select --"}
                      </option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="packageImage_url" className="form-label">
                    Image URL
                  </label>
                  <input
                    type="url"
                    className="form-control"
                    id="packageImage_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="is_active"
                    id="packageIsActive"
                    checked={formData.is_active}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <label className="form-check-label" htmlFor="packageIsActive">
                    Package is Active
                  </label>
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
                  disabled={isSubmitting || isCategoriesLoading}
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
