import React, { useEffect, useState } from "react";
import { supabase } from "@lib/supabaseClient";
import "./todays-deliveries.css";

interface Order {
  id: string;
  user_full_name: string;
  package_name: string;
  delivery_address: string;
  delivery_city: string;
  delivery_postal_code: string;
  delivery_end_date: string;
}

interface PackageCounter {
  package_name: string;
  pending_deliveries: number;
}

const ITEMS_PER_PAGE = 10;

const TodaysDeliveries: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [packageCounters, setPackageCounters] = useState<PackageCounter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPackage, setSelectedPackage] = useState<string | undefined>(
    undefined
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  /**
   * Fetch Orders with Active Deliveries
   */
  const fetchDeliveries = async (packageName?: string, page: number = 1) => {
    setIsLoading(true);
    const offset = (page - 1) * ITEMS_PER_PAGE;

    try {
      let query = supabase
        .from("orders")
        .select(
          `
          id, 
          user_full_name, 
          package_name, 
          delivery_address, 
          delivery_city, 
          delivery_postal_code, 
          delivery_end_date
        `
        )
        .gte("delivery_end_date", new Date().toISOString().split("T")[0])
        .order("delivery_end_date", { ascending: true })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (packageName) {
        query = query.eq("package_name", packageName);
      }

      if (searchTerm) {
        query = query.ilike("user_full_name", `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setOrders(data || []);
    } catch (err) {
      console.error("Error fetching deliveries:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch Package Counters
   */
  const fetchPackageCounters = async () => {
    try {
      const { data, error } = await supabase.rpc("get_package_counters");

      if (error) throw error;

      console.log("Package Counters:", data);
      setPackageCounters(data || []);
    } catch (err) {
      console.error("Error fetching package counters:", err);
    }
  };

  /**
   * Handle Counter Click
   */
  const handleCounterClick = (packageName: string) => {
    setSelectedPackage(packageName);
    setCurrentPage(1);
    fetchDeliveries(packageName);
  };

  /**
   * Handle Search
   */
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    fetchDeliveries(selectedPackage);
  };

  /**
   * Handle Pagination
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchDeliveries(selectedPackage, page);
  };

  /**
   * Reset Filter
   */
  const resetFilter = () => {
    setSelectedPackage(undefined);
    setSearchTerm("");
    setCurrentPage(1);
    fetchDeliveries();
  };

  /**
   * Real-Time Listener
   */
  useEffect(() => {
    fetchDeliveries();
    fetchPackageCounters();
  }, [selectedPackage, currentPage, searchTerm]);

  return (
    <div className="todays-deliveries-wrapper">
      <div className="header">
        <h2>Today's Deliveries</h2>

        {selectedPackage && (
          <button className="reset-filter-btn" onClick={resetFilter}>
            Show All Deliveries
          </button>
        )}

        <input
          type="text"
          className="search-input"
          placeholder="Search by Customer Name"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      <div className="counter-section">
        <div className="counter-grid">
          {packageCounters.map((counter) => (
            <div
              key={counter.package_name}
              className={`counter-card ${
                selectedPackage === counter.package_name ? "selected" : ""
              }`}
              onClick={() => handleCounterClick(counter.package_name)}
            >
              <h3>{counter.package_name}</h3>
              <p>{counter.pending_deliveries} Deliveries</p>
            </div>
          ))}
        </div>
      </div>

      <div className="table-section">
        <table className="delivery-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Package</th>
              <th>Address</th>
              <th>City</th>
              <th>Postal Code</th>
              <th>End Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7}>Loading...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7}>No deliveries found.</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id.substring(0, 8)}</td>
                  <td>{order.user_full_name}</td>
                  <td>{order.package_name}</td>
                  <td>{order.delivery_address}</td>
                  <td>{order.delivery_city}</td>
                  <td>{order.delivery_postal_code}</td>
                  <td>
                    {new Date(order.delivery_end_date).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="pagination-controls">
          <button
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </button>
          <span>Page {currentPage}</span>
          <button onClick={() => handlePageChange(currentPage + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodaysDeliveries;
