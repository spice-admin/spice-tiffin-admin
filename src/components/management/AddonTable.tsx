import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import Swal from "sweetalert2";

// Define the structure of an Addon object based on controller/model
interface Addon {
  _id: string;
  name: string;
  price: number;
  image: string; // Added image field (URL or path)
  createdAt: string;
  updatedAt: string; // Mongoose timestamps usually include this
}

// Define the handle interface for exposing methods via ref
export interface AddonTableHandle {
  refetch: () => void;
}

export interface AddonTableProps {
  onEdit: (addon: Addon) => void; // Function to call when Edit is clicked
}

const AddonTable = forwardRef<AddonTableHandle, AddonTableProps>(
  ({ onEdit }, ref) => {
    const [addons, setAddons] = useState<Addon[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Access the public API base URL from environment variables
    const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL;

    // Function to fetch addons from the API
    const fetchAddons = async () => {
      setLoading(true);
      try {
        // Endpoint confirmed by controller
        const res = await fetch(`${API_BASE_URL}/addons`);

        if (!res.ok) {
          let errorMsg = `HTTP error! status: ${res.status}`;
          try {
            const errorData = await res.json();
            errorMsg = errorData.message || errorMsg;
          } catch (parseError) {
            // Ignore if response isn't JSON
          }
          throw new Error(errorMsg);
        }

        const data = await res.json();

        // Structure confirmed by controller: { success, count, data }
        if (data.success && Array.isArray(data.data)) {
          setAddons(data.data);
        } else {
          console.warn(
            "⚠️ Unexpected response structure fetching addons:",
            data
          );
          setAddons([]);
        }
      } catch (err) {
        console.error("❌ Fetch addons error:", err);
        setAddons([]);
        // Consider showing a user-facing error notification here
        Swal.fire("Error", `Failed to fetch addons: ${err.message}`, "error");
      } finally {
        setLoading(false);
      }
    };

    // Fetch addons when the component mounts
    useEffect(() => {
      fetchAddons();
    }, []);

    // Expose the refetch function to parent components
    useImperativeHandle(ref, () => ({
      refetch: fetchAddons,
    }));

    // Function to handle addon deletion
    const handleDelete = async (id: string) => {
      const confirm = await Swal.fire({
        title: "Are you sure?",
        text: "This addon will be deleted permanently.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, delete it!",
      });

      if (!confirm.isConfirmed) return;

      try {
        // Endpoint and method confirmed by controller
        const res = await fetch(`${API_BASE_URL}/addons/${id}`, {
          method: "DELETE",
        });

        const data = await res.json();

        // Response structure confirmed by controller: { success, message }
        if (res.ok && data.success) {
          Swal.fire(
            "Deleted!",
            data.message || "Addon deleted successfully.",
            "success"
          );
          setAddons((prev) => prev.filter((addon) => addon._id !== id));
          // Note: If image deletion is handled server-side (as per TODO in controller),
          // no extra client-side action needed here for the image file itself.
        } else {
          throw new Error(data.message || "Delete failed");
        }
      } catch (error) {
        console.error("❌ Delete Addon Error:", error);
        Swal.fire("Error", `Failed to delete addon: ${error.message}`, "error");
      }
    };

    // Function to format currency
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("en-US", {
        // Using INR as example
        style: "currency",
        currency: "CAD",
      }).format(value);
    };

    return (
      <div className="table-responsive">
        {loading ? (
          <p className="text-center py-4">🔄 Loading addons...</p>
        ) : addons.length === 0 ? (
          <p className="text-center py-4">🚫 No addons found.</p>
        ) : (
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Image</th>
                <th>Addon Name</th>
                <th>Price</th>
                <th>Created At</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {addons.map((addon, index) => (
                <tr key={addon._id}>
                  <td>{index + 1}</td>
                  <td>
                    {addon.image ? (
                      <img
                        src={addon.image}
                        alt={addon.name}
                        style={{
                          height: "40px",
                          width: "auto",
                          objectFit: "cover",
                        }}
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        } // Hide on error
                      />
                    ) : (
                      <span className="text-muted fst-italic">No image</span>
                    )}
                  </td>
                  <td>{addon.name || "Untitled Addon"}</td>
                  <td>{formatCurrency(addon.price)}</td>
                  <td>{new Date(addon.createdAt).toLocaleString()}</td>
                  <td className="text-end">
                    {/* --- Placeholder for Edit Button --- */}
                    {/* This button would likely trigger a function passed via props
                        from AddonManagerWrapper to open the ManageAddonModal */}
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      title="Edit addon"
                      onClick={() => onEdit(addon)} // Call the onEdit prop
                    >
                      <i className="las la-pen" /> Edit
                    </button>
                    {/* ---------------------------------- */}
                    <button
                      className="btn btn-sm btn-outline-danger"
                      title="Delete addon"
                      onClick={() => handleDelete(addon._id)}
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
  }
);

export default AddonTable;
