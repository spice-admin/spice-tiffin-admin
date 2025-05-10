import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import Swal from "sweetalert2";
// 1. Import Supabase client
import { supabase } from "../../lib/supabaseClient"; // Adjust path as needed

// 2. Updated Category interface
interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryTableHandle {
  refetch: () => void;
}

const CategoryTable = forwardRef<CategoryTableHandle>((_props, ref) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null); // For displaying fetch errors

  // API_BASE_URL is no longer needed

  const fetchCategories = async () => {
    setLoading(true);
    setError(null); // Reset error before fetch
    try {
      // 3. Fetch categories using Supabase
      const { data, error: fetchError } = await supabase
        .from("categories")
        .select("*") // Select all columns
        .order("created_at", { ascending: false }); // Optional: order by creation date

      if (fetchError) {
        console.error("Error fetching categories:", fetchError);
        throw fetchError; // Throw error to be caught by catch block
      }

      setCategories(data || []); // Set to data or empty array if data is null
    } catch (err: any) {
      console.error("Fetch categories error in CategoryTable:", err);
      setError(err.message || "Failed to fetch categories.");
      setCategories([]);
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

  const handleDelete = async (categoryId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This category will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      // 4. Delete category using Supabase
      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .match({ id: categoryId }); // Match by 'id'

      if (deleteError) {
        throw deleteError;
      }

      Swal.fire("Deleted!", "The category has been deleted.", "success");
      // Refetch categories to update the list
      fetchCategories();
      // Or, for a more optimistic update:
      // setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
    } catch (err: any) {
      console.error("Delete category error:", err);
      Swal.fire("Error", err.message || "Failed to delete category.", "error");
    }
  };

  return (
    <div className="table-responsive">
      {loading && <p className="text-center py-4">🔄 Loading categories...</p>}
      {!loading && error && (
        <p className="text-center py-4 text-danger">Error: {error}</p>
      )}
      {!loading && !error && categories.length === 0 && (
        <p className="text-center py-4">🚫 No categories found. Add one!</p>
      )}
      {!loading && !error && categories.length > 0 && (
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
              <tr key={category.id}>
                {" "}
                {/* Use category.id */}
                <td>{index + 1}</td>
                <td>{category.name || "Untitled"}</td>
                <td>{new Date(category.created_at).toLocaleString()}</td>
                <td className="text-end">
                  <button
                    className="btn btn-sm btn-outline-danger"
                    title="Delete category"
                    onClick={() => handleDelete(category.id)}
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
