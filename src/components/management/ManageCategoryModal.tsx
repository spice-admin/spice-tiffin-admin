// src/components/management/ManageCategoryModal.tsx
import React, { useState } from "react";
import Swal from "sweetalert2";

interface Props {
  onCategoryAdded: () => void;
}

const ManageCategoryModal: React.FC<Props> = ({ onCategoryAdded }) => {
  const [name, setName] = useState("");

  const closeModal = () => {
    const modalElement = document.getElementById("categoryModal");
    if (modalElement) {
      const modalInstance =
        bootstrap.Modal.getInstance(modalElement) ||
        new bootstrap.Modal(modalElement);
      modalInstance.hide();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      Swal.fire("Error", "Please enter a category name", "error");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/v1/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        Swal.fire("Category added successfully", "success");
        setName("");
        closeModal();
        onCategoryAdded();

        if (typeof onCategoryAdded === "function") {
          onCategoryAdded();
        }
      } else {
        Swal.fire("Error", data.message || "Failed to add category", "error");
      }
    } catch (err) {
      console.error("Error adding category:", err);
      Swal.fire("Error", "Something went wrong", "error");
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
                Add Category
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={closeModal}
              ></button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="form-control"
                placeholder="Category Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Add Category
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManageCategoryModal;
