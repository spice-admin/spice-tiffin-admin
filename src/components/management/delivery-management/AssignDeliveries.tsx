import React, { useEffect, useState } from "react";
import { supabase } from "@lib/supabaseClient";
import "./assign-deliveries.css";

interface Order {
  id: string;
  user_full_name: string;
  delivery_address: string;
  delivery_city: string;
  package_name: string;
  delivery_end_date: string;
}

interface City {
  id: string;
  name: string;
}

interface Driver {
  id: string;
  full_name: string;
  phone: string;
}
interface AssignedDelivery {
  driverId: string;
  driverName: string;
  orderCount: number;
  orderIds: string[];
}

const AssignDeliveries: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [assignedDeliveries, setAssignedDeliveries] = useState<
    AssignedDelivery[]
  >([]);
  const [assignedOrderIds, setAssignedOrderIds] = useState<string[]>([]);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);

  /**
   * Fetch Orders
   */
  const fetchOrders = async (cityFilter?: string) => {
    try {
      let query = supabase
        .from("orders")
        .select(
          "id, user_full_name, delivery_address, delivery_city, package_name, delivery_end_date"
        )
        .gte("delivery_end_date", new Date().toISOString().split("T")[0]);

      if (cityFilter) {
        query = query.eq("delivery_city", cityFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Exclude assigned orders
      const filteredOrders =
        data?.filter((order) => !assignedOrderIds.includes(order.id)) || [];
      setOrders(filteredOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  /**
   * Fetch Cities
   */
  const fetchCities = async () => {
    try {
      const { data, error } = await supabase.from("cities").select("id, name");

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  /**
   * Fetch Drivers
   */
  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from("drivers")
        .select("id, full_name, phone")
        .eq("is_active", true);

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  /**
   * Assign Deliveries
   */
  const handleAssignDeliveries = () => {
    if (!selectedDriver || selectedOrders.length === 0) {
      alert("Please select a driver and at least one delivery.");
      return;
    }

    const driver = drivers.find((d) => d.id === selectedDriver);

    if (!driver) {
      alert("Driver not found.");
      return;
    }

    // Update the assigned deliveries state
    setAssignedDeliveries((prev) => {
      const existingEntryIndex = prev.findIndex(
        (entry) => entry.driverId === selectedDriver
      );

      if (existingEntryIndex !== -1) {
        const updated = [...prev];
        updated[existingEntryIndex].orderCount += selectedOrders.length;
        updated[existingEntryIndex].orderIds = [
          ...updated[existingEntryIndex].orderIds,
          ...selectedOrders,
        ];
        return updated;
      }

      return [
        ...prev,
        {
          driverId: selectedDriver,
          driverName: driver.full_name,
          orderCount: selectedOrders.length,
          orderIds: selectedOrders,
        },
      ];
    });

    // Update assigned order IDs state
    setAssignedOrderIds((prev) => [...prev, ...selectedOrders]);

    // Remove assigned orders from the main table
    setOrders((prev) =>
      prev.filter((order) => !selectedOrders.includes(order.id))
    );

    setSelectedOrders([]);
    setSelectedDriver("");
    setIsConfirmVisible(true);
  };

  /**
   * Fetch Data on Component Mount
   */
  useEffect(() => {
    fetchOrders();
    fetchCities();
    fetchDrivers();
  }, []);

  /**
   * Handle City Filter
   */
  const handleCityFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCity = e.target.value;
    setSelectedCity(selectedCity);
    fetchOrders(selectedCity);
  };

  /**
   * Handle Checkbox Selection
   */
  const handleCheckboxChange = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleConfirmAssignment = async () => {
    try {
      const assignmentPromises = assignedDeliveries.map(async (entry) => {
        const { driverId, orderIds } = entry;

        const { error } = await supabase.from("assigned_deliveries").insert({
          driver_id: driverId,
          delivery_date: new Date().toISOString().split("T")[0],
          order_ids: orderIds,
        });

        if (error) throw error;
      });

      await Promise.all(assignmentPromises);

      alert("Deliveries successfully assigned and stored.");
      setAssignedDeliveries([]);
      setIsConfirmVisible(false);

      window.location.href = "/route-optimization";
    } catch (error) {
      console.error("Error confirming assignment:", error);
      alert("Error confirming assignment.");
    }
  };

  return (
    <div className="assign-deliveries-wrapper">
      <h2>Assign Deliveries</h2>

      <div className="filter-section">
        <select value={selectedCity} onChange={handleCityFilter}>
          <option value="">All Cities</option>
          {cities.map((city) => (
            <option key={city.id} value={city.name}>
              {city.name}
            </option>
          ))}
        </select>

        <select
          value={selectedDriver}
          onChange={(e) => setSelectedDriver(e.target.value)}
        >
          <option value="">Select Driver</option>
          {drivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              {driver.full_name} - {driver.phone}
            </option>
          ))}
        </select>

        <button className="assign-btn" onClick={handleAssignDeliveries}>
          Assign Deliveries
        </button>
      </div>

      <table className="delivery-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Select</th>
            <th>Customer</th>
            <th>Address</th>
            <th>City</th>
            <th>Package</th>
            <th>End Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={7} className="no-data">
                No orders available for assignment.
              </td>
            </tr>
          ) : (
            orders.map((order, index) => (
              <tr key={order.id}>
                <td>{index + 1}</td>
                <td>
                  <input
                    type="checkbox"
                    value={order.id}
                    checked={selectedOrders.includes(order.id)}
                    onChange={() => handleCheckboxChange(order.id)}
                  />
                </td>
                <td>{order.user_full_name}</td>
                <td>{order.delivery_address}</td>
                <td>{order.delivery_city}</td>
                <td>{order.package_name}</td>
                <td>
                  {new Date(order.delivery_end_date).toLocaleDateString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h3>Assigned Deliveries</h3>

      <table className="assigned-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Driver</th>
            <th>Assigned Orders</th>
          </tr>
        </thead>
        <tbody>
          {assignedDeliveries.length === 0 ? (
            <tr>
              <td colSpan={3} className="no-data">
                No deliveries assigned yet.
              </td>
            </tr>
          ) : (
            assignedDeliveries.map((entry, index) => (
              <tr key={entry.driverId}>
                <td>{index + 1}</td>
                <td>
                  <a href={`/driver/${entry.driverId}`} className="driver-link">
                    {entry.driverName}
                  </a>
                </td>
                <td>{entry.orderCount}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isConfirmVisible && (
        <div className="confirm-section">
          <button className="confirm-btn" onClick={handleConfirmAssignment}>
            Confirm Assignment
          </button>
        </div>
      )}
    </div>
  );
};

export default AssignDeliveries;
