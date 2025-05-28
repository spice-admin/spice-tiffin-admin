// src/components/admin/addons/TodaysAddonOrdersView.tsx
import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient"; // Adjust path
import { format, parseISO, isValid, startOfDay } from "date-fns";

// Interfaces based on your addon_orders table and its JSONB content
interface AddonOrderItemDetail {
  addon_id: string;
  name: string;
  price_at_purchase: number;
  quantity: number;
}

interface City {
  id: string;
  name: string;
}

interface FetchedAddonOrder {
  id: string;
  main_order_id: string;
  addon_delivery_date: string;
  addons_ordered: AddonOrderItemDetail[];
  total_addon_price: number;
  currency: string;
  created_at: string;
  user_id: string;
  orders: {
    // Joined from orders table
    user_full_name: string | null;
    package_name: string | null;
    delivery_city: string | null; // <<--- ENSURE THIS IS SELECTED for filtering
  } | null;
}

const TodaysAddonOrdersView: React.FC = () => {
  const [addonOrders, setAddonOrders] = useState<FetchedAddonOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [viewingDate, setViewingDate] = useState<Date>(startOfDay(new Date()));
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("");

  const fetchAddonOrdersForSelectedDate = useCallback(
    async (dateToFetch: Date, cityToFilter?: string) => {
      // <<-- Added cityToFilter param
      setIsLoading(true);
      setError(null);
      const dateString = format(dateToFetch, "yyyy-MM-dd");
      console.log(
        `ADMIN_ADDONS: Fetching addon orders for date: ${dateString}, city: ${
          cityToFilter || "All"
        }`
      );

      try {
        let query = supabase
          .from("addon_orders")
          .select(
            `
          id, main_order_id, addon_delivery_date, addons_ordered, total_addon_price,
          currency, created_at, user_id, 
          orders!inner ( 
            user_full_name,
            package_name,
            delivery_city 
          )
        `,
            { count: "exact" }
          )
          .eq("addon_delivery_date", dateString);

        // **** APPLY CITY FILTER on the JOINED orders table ****
        if (cityToFilter) {
          // Assuming the column in your 'orders' table is 'delivery_city'
          // The syntax for filtering on a joined table is 'tableName.columnName'
          query = query.eq("orders.delivery_city", cityToFilter);
        }

        query = query.order("created_at", { ascending: false });

        const { data, error: dbError, count } = await query;

        console.log(
          "ADMIN_ADDONS: Supabase query executed. Error:",
          dbError,
          "Data:",
          data,
          "Count:",
          count
        );

        if (dbError) {
          console.error("ADMIN_ADDONS: Error fetching addon orders:", dbError);
          throw dbError;
        }

        setAddonOrders((data as FetchedAddonOrder[]) || []);
      } catch (err: any) {
        console.error(
          "ADMIN_ADDONS: Caught error in fetchAddonOrdersForSelectedDate:",
          err
        );
        setError(err.message || "Failed to load addon orders.");
        setAddonOrders([]);
      } finally {
        setIsLoading(false);
        console.log("ADMIN_ADDONS: fetchAddonOrdersForSelectedDate finished.");
      }
    },
    []
  );

  const fetchCitiesForFilter = useCallback(async () => {
    // Assuming you have a 'cities' table as discussed for AssignDeliveries.tsx
    // Or, you could get distinct cities from your 'orders' table if preferred.
    try {
      const { data, error: dbError } = await supabase
        .from("cities") // Your cities table name
        .select("id, name")
        .order("name", { ascending: true });
      if (dbError) throw dbError;
      setCities((data as City[]) || []);
    } catch (err: any) {
      console.error("ADMIN_ADDONS: Error fetching cities for filter:", err);
      // Not setting global error for this, dropdown will just be empty or show fewer options
    }
  }, []);

  useEffect(() => {
    fetchCitiesForFilter(); // Fetch cities once on mount
  }, [fetchCitiesForFilter]);

  useEffect(() => {
    // Fetch orders when viewingDate or selectedCityFilter changes
    fetchAddonOrdersForSelectedDate(viewingDate, selectedCityFilter);
  }, [viewingDate, selectedCityFilter, fetchAddonOrdersForSelectedDate]);

  const handleDateInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const dateValue = event.target.value; // This will be in 'YYYY-MM-DD' string format
    if (dateValue) {
      const parsedDate = parseISO(dateValue); // Convert string to Date object
      if (isValid(parsedDate)) {
        setViewingDate(startOfDay(parsedDate)); // Set to start of day for consistency
      } else {
        console.warn("Invalid date selected:", dateValue);
        // Optionally set an error or revert to a valid date
      }
    }
  };

  const handleCityFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedCityFilter(event.target.value);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <p>Loading addon orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="todays-addon-orders-view admin-section-card">
      {" "}
      {/* Added admin-section-card for consistent styling */}
      <div className="admin-card-header">
        <h2>Addon Orders for: {format(viewingDate, "MMMM dd, yyyy")}</h2>
        <div className="date-filter-container">
          <label htmlFor="addonOrderDateView">Select Date: </label>
          <input
            type="date"
            id="addonOrderDateView"
            value={format(viewingDate, "yyyy-MM-dd")} // Bind to viewingDate state
            onChange={handleDateInputChange}
            className="admin-date-input"
          />
        </div>
        <div className="city-filter-container">
          <label htmlFor="addonOrderCityFilter">City: </label>
          <select
            id="addonOrderCityFilter"
            value={selectedCityFilter}
            onChange={handleCityFilterChange}
            className="admin-select-input"
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city.id || city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {addonOrders.length === 0 ? (
        <p className="no-data-message">
          No addon orders scheduled for delivery on this date.
        </p>
      ) : (
        <div className="table-responsive-admin">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Addon Order ID</th>
                <th>Customer Name</th>
                <th>Main Package</th>
                <th>Addons Ordered</th>
                <th>Total Price</th>
                {/* Payment ID column removed */}
                <th>Order Placed At</th>
              </tr>
            </thead>
            <tbody>
              {addonOrders.map((order) => (
                <tr key={order.id}>
                  <td>...{order.id.slice(-8)}</td>
                  <td>{order.orders?.user_full_name || "N/A"}</td>
                  <td>{order.orders?.package_name || "N/A"}</td>
                  <td>
                    {Array.isArray(order.addons_ordered) &&
                    order.addons_ordered.length > 0 ? (
                      <ul className="addon-items-list-admin">
                        {order.addons_ordered.map((item, index) => (
                          <li key={item.addon_id || index}>
                            {item.name} (x{item.quantity}) - $
                            {item.price_at_purchase.toFixed(2)} each
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "No addon details"
                    )}
                  </td>
                  <td>
                    ${order.total_addon_price.toFixed(2)} {order.currency}
                  </td>
                  {/* Stripe Payment ID cell removed */}
                  <td>
                    {format(parseISO(order.created_at), "MMM dd, hh:mm a")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TodaysAddonOrdersView;
