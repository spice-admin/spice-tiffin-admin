// src/components/settings/DeliveryDateManager.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Calendar from "react-calendar";
import { supabase } from "../../lib/supabaseClient"; // Adjust path to your Supabase client
import {
  format,
  startOfMonth,
  endOfMonth,
  isEqual,
  startOfDay,
  addMonths,
  subMonths,
  isBefore,
  isValid,
} from "date-fns";
import type { User } from "@supabase/supabase-js";

// --- TypeScript Interfaces (as defined in Step 2) ---
interface DeliveryScheduleDB {
  event_date: string; // "yyyy-MM-dd"
  is_delivery_enabled: boolean;
  notes?: string | null;
  updated_at?: string;
  updated_by?: string | null;
}
type FetchedDatesState = Record<string, DeliveryScheduleDB>;
interface ModifiedDateInfo {
  is_delivery_enabled: boolean;
  original_status?: boolean;
  notes?: string | null;
}
type ModifiedDatesState = Record<string, ModifiedDateInfo>;

const DeliveryDateManager: React.FC = () => {
  const [activeStartDate, setActiveStartDate] = useState<Date>(
    startOfDay(new Date())
  );
  const [fetchedDates, setFetchedDates] = useState<FetchedDatesState>({});
  const [modifiedDates, setModifiedDates] = useState<ModifiedDatesState>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const today = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setCurrentUser(session?.user ?? null);
      if (!session?.user) {
        setError("Admin user session not found. Please log in.");
        setIsLoading(false); // Stop loading if no user
      }
    };
    getSession();
  }, []);

  const fetchDeliverySchedule = useCallback(
    async (viewStart: Date, viewEnd: Date) => {
      if (!currentUser) {
        // Don't fetch if user isn't determined yet or is null
        // Error is set by the useEffect that fetches user
        // setIsLoading(false); // Ensure loading is false if we bail early
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("delivery_schedule")
          .select(
            "event_date, is_delivery_enabled, notes, updated_by, updated_at"
          )
          .gte("event_date", format(viewStart, "yyyy-MM-dd"))
          .lte("event_date", format(viewEnd, "yyyy-MM-dd"));

        if (fetchError) throw fetchError;

        const newFetchedDates: FetchedDatesState = {};
        if (data) {
          data.forEach((item: DeliveryScheduleDB) => {
            // event_date from Supabase DATE type should already be "yyyy-MM-dd"
            newFetchedDates[item.event_date] = item;
          });
        }
        // Merge to keep data from other months if already fetched
        setFetchedDates((prev) => ({ ...prev, ...newFetchedDates }));
      } catch (err) {
        console.error("Error fetching delivery schedule:", err);
        setError(`Failed to load delivery dates: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser]
  ); // Depend on currentUser

  const saveChanges = async () => {
    if (Object.keys(modifiedDates).length === 0) return;
    if (!currentUser) {
      setError("Admin authentication required to save changes.");
      return;
    }

    const upsertData = Object.entries(modifiedDates).map(
      ([dateString, info]) => ({
        event_date: dateString,
        is_delivery_enabled: info.is_delivery_enabled,
        notes: info.notes || null, // Add notes if you implement UI for it
        updated_by: currentUser.id, // Track which admin made the change
      })
    );

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Using onConflict: 'event_date' ensures it updates if date exists, inserts if not.
      const { data: savedData, error: upsertError } = await supabase
        .from("delivery_schedule")
        .upsert(upsertData, { onConflict: "event_date" })
        .select(); // Important to .select() to get results back for UI update

      if (upsertError) throw upsertError;

      setSuccessMessage("Delivery dates updated successfully!");

      // Update fetchedDates with the saved data and clear modifications
      const newFetchedFromSave: FetchedDatesState = {};
      if (savedData) {
        savedData.forEach((item: any) => {
          // 'any' because upsert result might be less strictly typed by default
          const dbItem = item as DeliveryScheduleDB;
          newFetchedFromSave[dbItem.event_date] = dbItem;
        });
      }
      setFetchedDates((prev) => ({ ...prev, ...newFetchedFromSave }));
      setModifiedDates({}); // Clear modifications
    } catch (err) {
      console.error("Error saving delivery schedule:", err);
      setError(`Failed to save changes: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Effect to fetch data when activeStartDate changes or currentUser is available
  useEffect(() => {
    if (currentUser) {
      // Only fetch if we have a user
      // Fetch for current month and one month before/after for smoother navigation
      const viewStart = startOfMonth(subMonths(activeStartDate, 1));
      const viewEnd = endOfMonth(addMonths(activeStartDate, 1));
      fetchDeliverySchedule(viewStart, viewEnd);
    }
  }, [fetchDeliverySchedule, activeStartDate, currentUser]);

  const handleDateClick = (dateClickedRaw: Date) => {
    const dateClicked = startOfDay(dateClickedRaw); // Normalize to start of day
    const dateKey = format(dateClicked, "yyyy-MM-dd");

    if (isBefore(dateClicked, today)) {
      // Prevent modification of past dates
      return;
    }

    setModifiedDates((prev) => {
      const newModified = { ...prev };
      const currentFetched = fetchedDates[dateKey];
      const alreadyModified = prev[dateKey];

      // Determine the original status from DB (or default if not in DB)
      const originalDbStatus = currentFetched?.is_delivery_enabled ?? false; // Default to false if not fetched

      // Determine current displayed status (considering modifications or fetched data)
      const currentDisplayStatus = alreadyModified
        ? alreadyModified.is_delivery_enabled
        : originalDbStatus;

      const newToggledStatus = !currentDisplayStatus;

      if (newToggledStatus === (currentFetched?.is_delivery_enabled ?? false)) {
        // If toggled status is same as what's in DB (or default for un-set dates), remove from modified
        delete newModified[dateKey];
      } else {
        newModified[dateKey] = {
          is_delivery_enabled: newToggledStatus,
          original_status: originalDbStatus,
          // notes: alreadyModified?.notes || currentFetched?.notes || "" // Preserve notes if editing
        };
      }
      return newModified;
    });
    setSuccessMessage(null); // Clear success message on new modification
    setError(null); // Clear error message on new modification
  };

  const handleActiveStartDateChange = ({
    activeStartDate: newActiveStartDate,
  }: {
    activeStartDate: Date | null;
  }) => {
    if (newActiveStartDate && isValid(newActiveStartDate)) {
      const normalizedNewActiveStart = startOfDay(newActiveStartDate);
      // Check if the month or year has actually changed to avoid redundant fetches
      if (
        normalizedNewActiveStart.getMonth() !== activeStartDate.getMonth() ||
        normalizedNewActiveStart.getFullYear() !== activeStartDate.getFullYear()
      ) {
        setActiveStartDate(normalizedNewActiveStart);
      } else if (!isEqual(normalizedNewActiveStart, activeStartDate)) {
        // Still update if it's a different day within the same month,
        // although react-calendar might not trigger for this unless view changes.
        setActiveStartDate(normalizedNewActiveStart);
      }
    }
  };

  const getTileClassName = ({
    date: tileDateRaw,
    view,
  }: {
    date: Date;
    view: string;
  }): string | null => {
    if (view !== "month") return null;
    const tileDate = startOfDay(tileDateRaw); // Normalize
    const dateKey = format(tileDate, "yyyy-MM-dd");
    const isPast = isBefore(tileDate, today);

    let className = "calendar-tile";
    const modifiedInfo = modifiedDates[dateKey];
    const fetchedInfo = fetchedDates[dateKey];

    let isEnabled: boolean;
    let originalStatusFromDbOrModified: boolean | undefined;

    if (modifiedInfo) {
      isEnabled = modifiedInfo.is_delivery_enabled;
      originalStatusFromDbOrModified = modifiedInfo.original_status;
      className += " modified";
    } else if (fetchedInfo) {
      isEnabled = fetchedInfo.is_delivery_enabled;
      originalStatusFromDbOrModified = fetchedInfo.is_delivery_enabled;
    } else {
      // Default for dates not in DB and not modified
      isEnabled = false; // Assuming default is disabled
      originalStatusFromDbOrModified = false;
    }

    if (isPast) {
      // For past dates, show their historical status, don't allow them to look like current disabled/enabled interactively
      className +=
        (originalStatusFromDbOrModified ? " enabled-date" : " disabled-date") +
        " past-date";
    } else {
      className += isEnabled ? " enabled-date" : " disabled-date";
    }

    if (isEqual(tileDate, today)) {
      className += " today-date";
    }
    return className;
  };

  const hasChanges = Object.keys(modifiedDates).length > 0;

  // --- Render Logic ---
  if (!currentUser && !error) {
    // Show loading or prompt if user session isn't resolved yet (and no other error)
    return <div className="loading-indicator">Authenticating admin...</div>;
  }
  if (error && !isLoading && !isSaving) {
    // Show persistent error if not in loading/saving state
    // If error is auth-related and currentUser is null, it might already be handled or could be more specific here
  }

  // JSX remains largely the same as your old code, using the new state variables and handlers
  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Manage Delivery Dates</h5>
        <p className="card-subtitle mb-3 text-muted">
          Select or deselect dates to enable/disable them for delivery. Past
          dates cannot be changed.
        </p>

        {isLoading && !isSaving && (
          <div className="loading-indicator">Loading calendar data...</div>
        )}
        {error && <div className="error-message">{error}</div>}
        {successMessage && !error && (
          <div className="success-message">{successMessage}</div>
        )}

        <div className="calendar-wrapper">
          <Calendar
            onClickDay={handleDateClick}
            onActiveStartDateChange={handleActiveStartDateChange}
            activeStartDate={activeStartDate}
            value={null} // We manage selection state separately
            tileClassName={getTileClassName}
            // minDate={today} // Optionally prevent navigating to past months entirely
            next2Label={null} // Hide double month navigation
            prev2Label={null} // Hide double month navigation
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
