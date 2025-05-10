import React, { useState } from "react";
import Swal from "sweetalert2";
// 1. Import Supabase client
import { supabase } from "../../lib/supabaseClient"; // Adjust path as needed

interface Props {
  onCategoryAdded: () => void;
}

// API_BASE_URL is no longer needed

const ManageCategoryModal: React.FC<Props> = ({ onCategoryAdded }) => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false); // For loading state

  const closeModal = () => {
    const modalElement = document.getElementById("categoryModal");
    if (modalElement && (window as any).bootstrap) {
      // Check if bootstrap is available
      const modalInstance =
        (window as any).bootstrap.Modal.getInstance(modalElement) ||
        new (window as any).bootstrap.Modal(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      }
    }
    // Manually clear backdrop if it persists
    const backdrop = document.querySelector(".modal-backdrop");
    if (backdrop) {
      backdrop.remove();
    }
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!name.trim()) {
      Swal.fire("Validation Error", "Please enter a category name.", "error");
      setIsLoading(false);
      return;
    }

    try {
      // 2. Add category using Supabase
      const { data, error: insertError } = await supabase
        .from("categories")
        .insert([{ name: name.trim() }]) // Supabase expects an array of objects
        .select(); // Optionally select the inserted data back

      if (insertError) {
        // Handle potential unique constraint violation for name more gracefully
        if (insertError.code === "23505") {
          // PostgreSQL unique violation code
          throw new Error(`Category "${name.trim()}" already exists.`);
        }
        throw insertError;
      }

      // Assuming success if no error
      Swal.fire("Success!", "Category added successfully.", "success");
      setName(""); // Clear the input
      closeModal();
      if (typeof onCategoryAdded === "function") {
        onCategoryAdded(); // This will trigger refetch in CategoryTable
      }
    } catch (err: any) {
      console.error("Error adding category:", err);
      Swal.fire("Error", err.message || "Failed to add category.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="modal fade"
      id="categoryModal"
      tabIndex={-1}
      aria-labelledby="categoryModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title" id="categoryModalLabel">
                Add New Category
              </h5>
              <button
                type="button"
                className="btn-close"
                //  data-bs-dismiss="modal" // Handled by closeModal
                aria-label="Close"
                onClick={closeModal}
                disabled={isLoading}
              ></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="categoryName" className="form-label">
                  Category Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="categoryName"
                  placeholder="Enter category name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                //  data-bs-dismiss="modal" // Handled by closeModal
                onClick={closeModal}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Adding...
                  </>
                ) : (
                  "Add Category"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManageCategoryModal;
