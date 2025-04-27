import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import Swal from "sweetalert2";

interface Category {
  _id: string;
  name: string;
  createdAt: string;
}

export interface CategoryTableHandle {
  refetch: () => void;
}

const CategoryTable = forwardRef<CategoryTableHandle>((_props, ref) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL;

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      // Check for non-OK status codes first
      if (!res.ok) {
        // Try to parse error message from backend if possible
        let errorMsg = `HTTP error! status: ${res.status}`;
        try {
          const errorData = await res.json();
          errorMsg = errorData.message || errorMsg;
        } catch (parseError) {
          // Ignore if response isn't JSON
        }
        throw new Error(errorMsg);
      }

      // Parse the JSON response
      const data = await res.json();

      // *** CORRECTED CHECK ***
      // Check for success flag and that 'data.data' is an array
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data); // Use data.data!
      } else {
        // Log if the structure is unexpected (e.g., success is false, or data.data isn't an array)
        console.warn(
          "⚠️ Unexpected response structure in CategoryTable:",
          data
        );
        setCategories([]); // Set to empty if structure is wrong
      }
    } catch (err) {
      console.error("❌ Fetch categories error in CategoryTable:", err);
      setCategories([]); // Also set to empty on fetch errors
      // Optionally: Show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useImperativeHandle(ref, () => ({
    refetch: fetchCategories,
  }));

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This category will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        Swal.fire("Deleted!", data.message, "success");
        setCategories((prev) => prev.filter((cat) => cat._id !== id));
      } else {
        throw new Error(data.message || "Delete failed");
      }
    } catch (error) {
      console.error("❌ Delete Error:", error);
      Swal.fire("Error", "Failed to delete category", "error");
    }
  };

  return (
    <div className="table-responsive">
      {loading ? (
        <p className="text-center py-4">🔄 Loading categories...</p>
      ) : categories.length === 0 ? (
        <p className="text-center py-4">🚫 No categories found.</p>
      ) : (
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th>Category Name</th>
              <th>Created At</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category, index) => (
              <tr key={category._id}>
                <td>{index + 1}</td>
                <td>{category.name || "Untitled"}</td>
                <td>{new Date(category.createdAt).toLocaleString()}</td>
                <td className="text-end">
                  <button
                    className="btn btn-sm btn-outline-danger"
                    title="Delete category"
                    onClick={() => handleDelete(category._id)}
                  >
                    <i className="las la-trash-alt" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
});

export default CategoryTable;
