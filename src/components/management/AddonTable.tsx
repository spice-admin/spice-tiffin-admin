// src/components/management/AddonTable.tsx
import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import Swal from "sweetalert2";
import { supabase } from "../../lib/supabaseClient"; // Your Supabase client
import type { Addon } from "../../types"; // Assuming types are in src/types

export interface AddonTableHandle {
  refetch: () => void;
}

export interface AddonTableProps {
  onEdit: (addon: Addon) => void;
}

const AddonTable = forwardRef<AddonTableHandle, AddonTableProps>(
  ({ onEdit }, ref) => {
    const [addons, setAddons] = useState<Addon[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchAddons = useCallback(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("addons")
          .select("*") // Select all columns
          .order("name", { ascending: true }); // Order by name

        if (error) throw error;

        setAddons(data || []);
      } catch (err: any) {
        console.error("Fetch addons error:", err);
        setAddons([]);
        Swal.fire(
          "Error",
          `Failed to fetch addons: ${err.message || "Unknown error"}`,
          "error"
        );
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      fetchAddons();
    }, [fetchAddons]);

    useImperativeHandle(ref, () => ({
      refetch: fetchAddons,
    }));

    const handleDelete = async (id: string, addonName: string) => {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: `You are about to delete "${addonName}". This action is permanent.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, delete it!",
      });

      if (!result.isConfirmed) return;

      try {
        setLoading(true); // Indicate loading for delete action
        const { error } = await supabase.from("addons").delete().eq("id", id);

        if (error) throw error;

        Swal.fire(
          "Deleted!",
          `Addon "${addonName}" has been deleted.`,
          "success"
        );
        // Refetch or filter locally
        setAddons((prev) => prev.filter((addon) => addon.id !== id));
      } catch (error: any) {
        console.error("Delete Addon Error:", error);
        Swal.fire(
          "Error",
          `Failed to delete addon: ${error.message || "Unknown error"}`,
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    const formatCurrency = (value: number | null | undefined) => {
      if (value === null || value === undefined) return "N/A";
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "CAD", // Change as needed
      }).format(value);
    };

    const formatDate = (dateString?: string | null) => {
      if (!dateString) return "N/A";
      try {
        return new Date(dateString).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          // hour: '2-digit', minute: '2-digit' // Optionally add time
        });
      } catch (e) {
        return "Invalid Date";
      }
    };

    if (loading && addons.length === 0) {
      // Show loading only on initial fetch
      return <p className="text-center py-4">🔄 Loading addons...</p>;
    }
    if (!loading && addons.length === 0) {
      return (
        <p className="text-center py-4">
          🚫 No addons found. Click "Add Addon" to create one.
        </p>
      );
    }

    return (
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
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
              <tr key={addon.id}>
                <td>{index + 1}</td>
                <td>
                  {addon.image_url ? (
                    <img
                      src={addon.image_url}
                      alt={addon.name}
                      style={{
                        height: "40px",
                        width: "auto",
                        objectFit: "cover",
                      }}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <span className="text-muted fst-italic">No image</span>
                  )}
                </td>
                <td>{addon.name || "N/A"}</td>
                <td>{formatCurrency(addon.price)}</td>
                <td>{formatDate(addon.created_at)}</td>
                <td className="text-end">
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    title="Edit addon"
                    onClick={() => onEdit(addon)}
                    disabled={loading} // Disable if any table-level loading is happening
                  >
                    <i className="las la-pen" /> Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    title="Delete addon"
                    onClick={() => handleDelete(addon.id, addon.name)}
                    disabled={loading} // Disable if any table-level loading is happening
                  >
                    <i className="las la-trash-alt" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);

export default AddonTable;
