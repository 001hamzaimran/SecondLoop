import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {toast} from "react-toastify"
import "./TradeInRules.css";

export default function TradeInRules() {
  const navigate = useNavigate();

  // state
  const [prices, setPrices] = useState({ good: 5000, fair: 3000, poor: 1000 });
  const [allowManualPrice, setAllowManualPrice] = useState(true);
  const [autoApproveGood, setAutoApproveGood] = useState(false);
  const [rejectPoor, setRejectPoor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handlePriceChange = (key, value) => {
    // keep only numbers
    const num = Number(String(value).replace(/[^\d]/g, "")) || 0;
    setPrices((p) => ({ ...p, [key]: num }));
  };

  const handleSave = () => {
    setSaving(true);
    const payload = {
      prices,
      allowManualPrice,
      autoApproveGood,
      rejectPoor,
    };
    console.log("Trade-In rules saved:", payload);

    // show success message (simulated save)
    toast.success("rules saved successfully");
    setTimeout(() => {
      setMessage("");
      setSaving(false);
    }, 1400);
  };

  return (
    <div className="tir-page">
      <header className="tir-header">
        <button className="back" onClick={() => navigate(-1)} aria-label="back">
          ← Trade-In Requests
        </button>

        <div className="header-actions">
          <button className="btn ghost" onClick={() => navigate("/tradein")}>
            cancel
          </button>
          <button className="btn primary" onClick={handleSave} disabled={saving}>
            {saving ? "saving..." : "save rules"}
          </button>
        </div>
      </header>

      <main className="tir-main">
        <section className="info-banner">
          <strong>How rules work</strong>
          <p>
            Condition-based prices are used by default. Enable manual pricing
            to override while reviewing requests. Advanced rules can auto-approve
            or auto-reject certain conditions.
          </p>
        </section>

        <div className="grid">
          {/* Price by condition */}
          <div className="card">
            <div className="card-head">
              <h3>price by condition</h3>
              <small>set default trade-in values (PKR)</small>
            </div>

            <div className="price-row">
              <label className="field">
                <div className="field-label">good</div>
                <div className="field-input">
                  <input
                    type="number"
                    min="0"
                    value={prices.good}
                    onChange={(e) => handlePriceChange("good", e.target.value)}
                  />
                  <span className="suffix">PKR</span>
                </div>
              </label>

              <label className="field">
                <div className="field-label">fair</div>
                <div className="field-input">
                  <input
                    type="number"
                    min="0"
                    value={prices.fair}
                    onChange={(e) => handlePriceChange("fair", e.target.value)}
                  />
                  <span className="suffix">PKR</span>
                </div>
              </label>

              <label className="field">
                <div className="field-label">poor</div>
                <div className="field-input">
                  <input
                    type="number"
                    min="0"
                    value={prices.poor}
                    onChange={(e) => handlePriceChange("poor", e.target.value)}
                  />
                  <span className="suffix">PKR</span>
                </div>
              </label>
            </div>
          </div>

          {/* Manual pricing */}
          <div className="card stacked">
            <div className="card-head">
              <h3>manual pricing</h3>
              <small>allow admins to override the price</small>
            </div>

            <div className="row">
              <div className="row-left">
                <p className="muted">
                  Let admins set a custom payout when reviewing a request.
                </p>
              </div>

              <div className="row-right">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={allowManualPrice}
                    onChange={(e) => setAllowManualPrice(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>
          </div>

          {/* Advanced rules */}
          <div className="card stacked">
            <div className="card-head">
              <h3>advanced rules</h3>
              <small>automate approvals & rejections</small>
            </div>

            <div className="rule">
              <div className="rule-left">
                <h4>auto-approve good</h4>
                <p className="muted">Automatically approve requests marked as Good.</p>
              </div>
              <div className="rule-right">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={autoApproveGood}
                    onChange={(e) => setAutoApproveGood(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>

            <div className="rule">
              <div className="rule-left">
                <h4>reject poor</h4>
                <p className="muted">Automatically reject requests marked as Poor.</p>
              </div>
              <div className="rule-right">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={rejectPoor}
                    onChange={(e) => setRejectPoor(e.target.checked)}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* bottom save + message */}
        <div className="save-row">
          <div className="save-left">
            <button className="btn ghost" onClick={() => {
              // reset to defaults
              setPrices({ good: 5000, fair: 3000, poor: 1000 });
              setAllowManualPrice(true);
              setAutoApproveGood(false);
              setRejectPoor(false);
              toast("reset to defaults");
              setTimeout(() => setMessage(""), 1200);
            }}>
              reset defaults
            </button>
          </div>

          <div className="save-right">
            <button className="btn primary" onClick={handleSave} disabled={saving}>
              {saving ? "saving..." : "save rules"}
            </button>
          </div>
        </div>

        {message && <div className="toast">{message}</div>}
      </main>
    </div>
  );
}
