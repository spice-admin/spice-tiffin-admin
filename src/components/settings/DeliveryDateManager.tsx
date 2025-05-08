import React, { useState, useEffect, useCallback, useMemo } from "react";
import Calendar from "react-calendar";
import axios from "axios"; // Or your preferred HTTP client
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isEqual,
  startOfDay,
  addMonths,
  subMonths,
  isBefore,
  isValid,
} from "date-fns";

// --- TypeScript Interfaces ---

interface OperationalDateDB {
  _id?: string;
  date: string; // ISO string from DB
  isDeliveryEnabled: boolean;
  notes?: string;
  setBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ModifiedDateInfo {
  isDeliveryEnabled: boolean;
  originalStatus?: boolean; // To track if it was initially enabled
  notes?: string; // We can add UI for notes later if needed
}

// Type for the state storing fetched and modified dates
// Key is YYYY-MM-DD string
type OperationalDatesState = Record<string, OperationalDateDB>;
type ModifiedDatesState = Record<string, ModifiedDateInfo>;

// --- API Configuration ---
const BACKEND_API_ROOT = import.meta.env.PUBLIC_API_BASE_URL;
const OPERATIONAL_DATES_API_ENDPOINT = `${BACKEND_API_ROOT}/operational-dates`;

// Ensure the root URL is defined
if (!BACKEND_API_ROOT) {
  console.error(
    "FATAL ERROR: PUBLIC_API_BASE_URL is not defined in environment variables. Frontend won't be able to connect to the backend."
  );
  // You might want to throw an error or display a more user-friendly message
}

const DeliveryDateManager: React.FC = () => {
  const [activeStartDate, setActiveStartDate] = useState<Date>(new Date()); // For calendar navigation
  const [fetchedDates, setFetchedDates] = useState<OperationalDatesState>({});
  const [modifiedDates, setModifiedDates] = useState<ModifiedDatesState>({});

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const today = useMemo(() => startOfDay(new Date()), []); // Memoize today's date

  // --- API Call Functions ---
  const fetchOperationalDates = useCallback(
    async (startDate: Date, endDate: Date) => {
      if (!BACKEND_API_ROOT) {
        // Check if the base URL is available
        setError("API base URL is not configured. Cannot fetch data.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        // Use the fully constructed endpoint
        const response = await axios.get<{
          success: boolean;
          data: OperationalDateDB[];
        }>(`${OPERATIONAL_DATES_API_ENDPOINT}`, {
          params: {
            startDate: format(startDate, "yyyy-MM-dd"),
            endDate: format(endDate, "yyyy-MM-dd"),
          },
          withCredentials: true,
        });
        if (response.data.success) {
          const newFetchedDates: OperationalDatesState = {};
          response.data.data.forEach((opDate) => {
            // Ensure date from DB (likely ISO string) is treated as UTC midnight
            const dateKey = format(new Date(opDate.date), "yyyy-MM-dd");
            newFetchedDates[dateKey] = {
              ...opDate,
              date: dateKey, // Store normalized date key
            };
          });
          setFetchedDates((prev) => ({ ...prev, ...newFetchedDates })); // Merge with existing to keep other months' data
        } else {
          throw new Error("Failed to fetch operational dates from API.");
        }
      } catch (err) {
        console.error("Error fetching operational dates:", err);
        const message =
          err instanceof Error ? err.message : "An unknown error occurred.";
        setError(`Failed to load delivery dates: ${message}`);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const saveChanges = async () => {
    if (Object.keys(modifiedDates).length === 0) return;
    if (!BACKEND_API_ROOT) {
      // Check if the base URL is available
      setError("API base URL is not configured. Cannot save data.");
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    const payload = {
      dates: Object.entries(modifiedDates).map(([dateString, info]) => ({
        date: dateString,
        isDeliveryEnabled: info.isDeliveryEnabled,
      })),
    };

    try {
      // Use the fully constructed endpoint for batch update
      const response = await axios.post<{
        success: boolean;
        message?: string;
        data: OperationalDateDB[];
      }>(`${OPERATIONAL_DATES_API_ENDPOINT}/batch`, payload, {
        withCredentials: true,
      });

      if (response.data.success) {
        setSuccessMessage(
          response.data.message || "Delivery dates updated successfully!"
        );
        // Update fetchedDates with the saved data and clear modifications
        const newFetchedFromSave: OperationalDatesState = {};
        response.data.data.forEach((opDate) => {
          const dateKey = format(new Date(opDate.date), "yyyy-MM-dd");
          newFetchedFromSave[dateKey] = { ...opDate, date: dateKey };
        });
        setFetchedDates((prev) => ({ ...prev, ...newFetchedFromSave }));
        setModifiedDates({}); // Clear modifications
        // Optionally re-fetch for the current view to be absolutely sure
        // const currentViewStart = startOfMonth(activeStartDate);
        // const currentViewEnd = endOfMonth(activeStartDate);
        // fetchOperationalDates(currentViewStart, currentViewEnd);
      } else {
        throw new Error(response.data.message || "Failed to save changes.");
      }
    } catch (err) {
      console.error("Error saving operational dates:", err);
      const message =
        err instanceof Error
          ? err.message
          : "An unknown server error occurred.";
      setError(`Failed to save changes: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    const viewStart = startOfMonth(subMonths(activeStartDate, 1));
    const viewEnd = endOfMonth(addMonths(activeStartDate, 1));
    fetchOperationalDates(viewStart, viewEnd);
  }, [fetchOperationalDates, activeStartDate]);

  // --- Event Handlers ---
  const handleDateClick = (dateClicked: Date) => {
    const dateKey = format(dateClicked, "yyyy-MM-dd");

    // Prevent modification of past dates
    if (isBefore(dateClicked, today)) {
      return;
    }

    setModifiedDates((prev) => {
      const newModified = { ...prev };
      const currentFetchedDate = fetchedDates[dateKey];
      const currentModifiedInfo = prev[dateKey];

      let originalStatus = currentFetchedDate?.isDeliveryEnabled;
      if (
        currentModifiedInfo &&
        currentModifiedInfo.originalStatus !== undefined
      ) {
        originalStatus = currentModifiedInfo.originalStatus;
      } else if (currentFetchedDate) {
        originalStatus = currentFetchedDate.isDeliveryEnabled;
      } else {
        originalStatus = false;
      }

      let newStatus: boolean;
      if (currentModifiedInfo) {
        newStatus = !currentModifiedInfo.isDeliveryEnabled;
      } else if (currentFetchedDate) {
        newStatus = !currentFetchedDate.isDeliveryEnabled;
      } else {
        newStatus = true;
      }

      const dbStatus = currentFetchedDate?.isDeliveryEnabled ?? false;
      if (newStatus === dbStatus) {
        delete newModified[dateKey];
      } else {
        newModified[dateKey] = {
          isDeliveryEnabled: newStatus,
          originalStatus: originalStatus,
        };
      }
      return newModified;
    });
    setSuccessMessage(null);
  };

  const handleActiveStartDateChange = ({
    activeStartDate: newActiveStartDate,
  }: {
    activeStartDate: Date | null;
  }) => {
    if (newActiveStartDate && isValid(newActiveStartDate)) {
      const currentMonthStart = startOfMonth(activeStartDate);
      const newMonthStart = startOfMonth(newActiveStartDate);

      if (!isEqual(currentMonthStart, newMonthStart)) {
        setActiveStartDate(newActiveStartDate);
      } else {
        setActiveStartDate(newActiveStartDate);
      }
    }
  };

  const getTileClassName = ({
    date,
    view,
  }: {
    date: Date;
    view: string;
  }): string | null => {
    if (view !== "month") return null;

    const dateKey = format(date, "yyyy-MM-dd");
    const isPast = isBefore(date, today);

    let className = "calendar-tile";
    const modifiedInfo = modifiedDates[dateKey];
    const fetchedInfo = fetchedDates[dateKey];

    let isEnabled: boolean;

    if (modifiedInfo) {
      isEnabled = modifiedInfo.isDeliveryEnabled;
      className += " modified";
    } else if (fetchedInfo) {
      isEnabled = fetchedInfo.isDeliveryEnabled;
    } else {
      isEnabled = false;
    }

    if (isPast) {
      className += " disabled-date";
      if (fetchedInfo?.isDeliveryEnabled && !modifiedInfo) {
        className += " enabled-date";
      } else if (modifiedInfo?.isDeliveryEnabled) {
        className += " enabled-date";
      }
    } else {
      className += isEnabled ? " enabled-date" : " disabled-date";
    }

    if (isEqual(date, today)) {
      className += " today-date";
    }

    return className;
  };

  const hasChanges = Object.keys(modifiedDates).length > 0;

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Manage Delivery Dates</h5>
        <p className="card-subtitle mb-3 text-muted">
          Select or deselect dates to enable/disable them for delivery. Past
          dates cannot be changed.
        </p>

        {isLoading && (
          <div className="loading-indicator">Loading calendar data...</div>
        )}
        {error && <div className="error-message">{error}</div>}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        <div className="calendar-wrapper">
          <Calendar
            onClickDay={handleDateClick}
            onActiveStartDateChange={handleActiveStartDateChange}
            activeStartDate={activeStartDate}
            value={null}
            tileClassName={getTileClassName}
            minDate={undefined}
            next2Label={null}
            prev2Label={null}
          />
        </div>

        <div className="save-button-container">
          <button
            className="save-button"
            onClick={saveChanges}
            disabled={!hasChanges || isSaving || isLoading}
          >
            {isSaving ? (
              <>
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
          {!hasChanges && !isSaving && (
            <span className="no-changes-note">No changes to save.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryDateManager;
