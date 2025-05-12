import React, { useState } from "react";
import type { IOrder } from "@orders/index";
import "./form.css";
import { HiOutlineX } from "react-icons/hi";
import { supabase } from "@lib/supabaseClient";

interface OrderFormProps {
  initialOrder?: Partial<IOrder>;
  onSubmit: () => void;
  onCancel: () => void;
}

const OrderForm: React.FC<OrderFormProps> = ({
  initialOrder,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<IOrder>>(initialOrder || {});
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Handle Form Input Changes
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  /**
   * Handle Form Submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    if (!formData.id) {
      console.error("Order ID is missing. Cannot update order.");
      setIsSaving(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("orders")
        .update({
          user_full_name: formData.user_full_name,
          user_email: formData.user_email,
          user_phone: formData.user_phone,
          package_name: formData.package_name,
          package_type: formData.package_type,
          package_price: formData.package_price,
          package_days: formData.package_days,
          delivery_start_date: formData.delivery_start_date,
          delivery_end_date: formData.delivery_end_date,
          delivery_address: formData.delivery_address,
          delivery_city: formData.delivery_city,
          delivery_postal_code: formData.delivery_postal_code,
          order_status: formData.order_status,
        })
        .eq("id", formData.id);

      if (error) {
        console.error("Update Error:", error.message);
        alert("Error updating order: " + error.message);
      } else {
        alert("Order updated successfully.");
        onSubmit();
      }
    } catch (err) {
      console.error("Update Error:", err);
      alert("An unexpected error occurred while updating the order.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content form-modal">
        <button className="modal-close" onClick={onCancel}>
          <HiOutlineX size={24} />
        </button>

        <h2 className="modal-title">Update Order Details</h2>

        <form onSubmit={handleSubmit} className="form-grid">
          {/* Customer Details */}
          <div className="form-section">
            <h3>Customer Information</h3>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="user_full_name"
                value={formData.user_full_name || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="user_email"
                value={formData.user_email || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="text"
                name="user_phone"
                value={formData.user_phone || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Package Details */}
          <div className="form-section">
            <h3>Package Information</h3>
            <div className="form-group">
              <label>Package Name</label>
              <input
                type="text"
                name="package_name"
                value={formData.package_name || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Type</label>
              <input
                type="text"
                name="package_type"
                value={formData.package_type || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Price</label>
              <input
                type="number"
                name="package_price"
                value={formData.package_price || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Days</label>
              <input
                type="number"
                name="package_days"
                value={formData.package_days || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Delivery Details */}
          <div className="form-section">
            <h3>Delivery Information</h3>
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                name="delivery_start_date"
                value={formData.delivery_start_date || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                name="delivery_end_date"
                value={formData.delivery_end_date || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="delivery_address"
                value={formData.delivery_address || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="delivery_city"
                value={formData.delivery_city || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Postal Code</label>
              <input
                type="text"
                name="delivery_postal_code"
                value={formData.delivery_postal_code || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Order Status</h3>
            <div className="form-group">
              <label>Status</label>
              <select
                name="order_status"
                value={formData.order_status || ""}
                onChange={handleChange}
              >
                <option value="pending_confirmation">
                  Pending Confirmation
                </option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;
