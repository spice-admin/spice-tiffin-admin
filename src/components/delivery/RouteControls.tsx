// src/components/delivery/RouteControls.tsx

import React from "react";

interface RouteControlsProps {
  selectedDriverId: string | null;
  onOptimize: () => void; // Callback for optimize button
  onSend: () => void; // Callback for send button
  isLoading: boolean; // Loading state for optimize/send actions
  canOptimize: boolean; // Condition to enable optimize button
  canSend: boolean; // Condition to enable send button
}

const RouteControls: React.FC<RouteControlsProps> = ({
  selectedDriverId,
  onOptimize,
  onSend,
  isLoading,
  canOptimize,
  canSend,
}) => {
  return (
    <div className="card">
      <div className="card-body">
        <h6 className="card-title">Route Actions</h6>
        {!selectedDriverId && (
          <p className="text-muted">Select a driver to see route actions.</p>
        )}
        {selectedDriverId && (
          <div className="d-flex flex-wrap gap-2">
            {" "}
            {/* Use flex and gap */}
            <button
              className="btn btn-info"
              onClick={onOptimize}
              disabled={!canOptimize || isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Optimizing...
                </>
              ) : (
                "Optimize Route"
              )}
            </button>
            <button
              className="btn btn-success"
              onClick={onSend}
              disabled={!canSend || isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Sending...
                </>
              ) : (
                "Send Route to Driver"
              )}
            </button>
          </div>
        )}
        {!selectedDriverId && !canOptimize && (
          <p className="text-muted small mt-2">Assign orders to optimize.</p>
        )}
        {!selectedDriverId && !canSend && (
          <p className="text-muted small mt-2">
            Assign and optimize route to send.
          </p>
        )}
      </div>
    </div>
  );
};

export default RouteControls;
