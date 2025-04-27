import React from "react";
import Swal from "sweetalert2";

interface Category {
  _id: string;
  name: string;
}

interface Props {
  categories: Category[];
  onRefresh: () => void;
  onEditClick: (category: Category) => void;
}

const ManageCategoryTable: React.FC<Props> = ({
  categories,
  onRefresh,
  onEditClick,
}) => {
  const handleDelete = async (category: Category) => {
    const confirm = await Swal.fire({
      title: `Delete "${category.name}"?`,
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch(
          `http://localhost:5000/api/v1/categories/${category._id}`,
          { method: "DELETE" }
        );
        const data = await res.json();

        if (res.ok) {
          Swal.fire("Deleted!", data.message || "Category deleted.", "success");
          onRefresh();
        } else {
          Swal.fire(
            "Failed!",
            data.message || "Could not delete category.",
            "error"
          );
        }
      } catch (err) {
        Swal.fire("Error!", "Something went wrong.", "error");
      }
    }
  };

  return (
    <div className="table-responsive">
      <table className="table mb-0 table-bordered table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category, index) => (
            <tr key={category._id}>
              <td>{index + 1}</td>
              <td>{category.name}</td>
              <td className="text-end">
                <button
                  className="btn btn-sm btn-outline-secondary me-2"
                  onClick={() => onEditClick(category)}
                >
                  <i className="las la-pen fs-18" />
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(category)}
                >
                  <i className="las la-trash-alt fs-18" />
                </button>
              </td>
            </tr>
          ))}
          {categories.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center text-muted">
                No categories found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ManageCategoryTable;
