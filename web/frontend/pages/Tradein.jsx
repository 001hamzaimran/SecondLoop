import React, { useState, useMemo } from "react";
import { toast } from "react-toastify"
import "./Tradein.css";

export default function Tradein() {
  // price rules (you can replace with API values)
  const DEFAULT_PRICES = { good: 5000, fair: 3000, poor: 1000 };

  const [requests, setRequests] = useState([
    {
      id: "TI-1287",
      customer: "Ali Khan",
      email: "ali@gmail.com",
      product: "Leather Jacket",
      condition: "good",
      status: "pending",
      date: "2026-01-25",
      images: [
        "https://picsum.photos/800/480?1",
        "https://picsum.photos/800/480?2",
        "https://picsum.photos/800/480?4",
      ],
    },
    {
      id: "TI-1279",
      customer: "Sara Ahmed",
      email: "sara@gmail.com",
      product: "Running Shoes",
      condition: "fair",
      status: "approved",
      date: "2026-01-24",
      images: ["https://picsum.photos/800/480?3"],
    },
    {
      id: "TI-1268",
      customer: "Bilal Khan",
      email: "bilal@mail.com",
      product: "Wool Scarf",
      condition: "poor",
      status: "rejected",
      date: "2026-01-20",
      images: ["https://picsum.photos/800/480?5"],
    },
  ]);

  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [overridePrice, setOverridePrice] = useState("");
  const [allowManual, setAllowManual] = useState(true);

  // derived list
  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        r.customer.toLowerCase().includes(q) ||
        r.product.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [requests, query, filterStatus]);

  function formatPrice(n) {
    if (typeof n === "number") return "PKR " + n.toLocaleString();
    return n;
  }

  function computedPriceFor(request) {
    const k = request.condition.toLowerCase();
    return DEFAULT_PRICES[k] ?? 0;
  }

  function openModal(request) {
    setSelected(request);
    setSelectedImage(request.images && request.images[0]);
    setOverridePrice(""); // reset override each time
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setSelected(null);
    setSelectedImage(null);
  }

  function setStatus(id, status, finalPrice = null) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, approvedPrice: finalPrice ?? r.approvedPrice } : r
      )
    );
  }

  function handleApprove() {
    if (!selected) return;
    const final = overridePrice ? Number(overridePrice) : computedPriceFor(selected);
    setStatus(selected.id, "approved", final);
    toast.success("Request Approved Successfully")
    closeModal();
  }

  function handleReject() {
    if (!selected) return;
    setStatus(selected.id, "rejected");
    toast.error("Request Rejected Successfully")
    closeModal();
  }

  function handleIssueCredit() {
    if (!selected) return;
    const final = overridePrice ? Number(overridePrice) : computedPriceFor(selected);
    // for MVP we just mark approved and store price
    setStatus(selected.id, "approved", final);
    toast.success(`issued credit: ${formatPrice(final)} to ${selected.customer}`)
    closeModal();
  }

  // small counts
  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="ti-page">
      <header className="ti-header">
        <div className="ti-title">
          <h1>Trade-In Requests</h1>
          <p className="muted">Review, verify, and issue paybacks — VIP admin panel</p>
        </div>

        <div className="ti-actions">
          <div className="search-wrap">
            <input
              className="search"
              placeholder="Search by customer, product or id..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <select className="status-filter" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <button className="btn ghost" onClick={() => { navigator.clipboard?.writeText(JSON.stringify(requests)); alert("exported to clipboard (json)"); }}>
            Export
          </button>
        </div>
      </header>

      <section className="ti-cards">
        <div className="stat-card">
          <small>Pending</small>
          <strong>{counts.pending}</strong>
          <span className="chip warning">Needs review</span>
        </div>

        <div className="stat-card">
          <small>Approved</small>
          <strong>{counts.approved}</strong>
          <span className="chip success">Completed</span>
        </div>

        <div className="stat-card">
          <small>Rejected</small>
          <strong>{counts.rejected}</strong>
          <span className="chip danger">Rejected</span>
        </div>
      </section>

      <section className="ti-table-wrap">
        <table className="ti-table">
          <thead>
            <tr>
              <th>Request</th>
              <th>Product</th>
              <th>Condition</th>
              <th>Price</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r) => {
              const cp = computedPriceFor(r);
              return (
                <tr key={r.id} className={r.status === "pending" ? "row-pending" : r.status === "approved" ? "row-approved" : "row-rejected"}>
                  <td>
                    <div className="customer">
                      <div className="avatar" style={{ backgroundImage: `url(${r.images[0]})` }} />
                      <div>
                        <div className="cust-name">{r.customer}</div>
                        <div className="cust-email muted">{r.email}</div>
                        <div className="id muted">{r.id}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="product">{r.product}</div>
                  </td>

                  <td>
                    <div className={`cond ${r.condition}`}>{r.condition}</div>
                  </td>

                  <td>
                    <div className="price-col">
                      <div className="computed">{formatPrice(cp)}</div>
                      <div className="small muted">rule</div>
                    </div>
                  </td>

                  <td>
                    <div className={`status ${r.status}`}>{r.status}</div>
                  </td>

                  <td>
                    <div className="muted">{r.date}</div>
                  </td>

                  <td style={{ textAlign: "right" }}>
                    <button className="btn slim" onClick={() => openModal(r)}>View</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "28px 12px", color: "#666" }}>
                  No requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Modal */}
      {modalOpen && selected && (
        <div className="ti-modal">
          <div className="ti-modal-overlay" onClick={closeModal} />
          <div className="ti-modal-panel" role="dialog" aria-modal="true" aria-label="request detail">
            <div className="modal-head">
              <div>
                <h2>Request {selected.id}</h2>
                <div className="muted">{selected.customer} • {selected.email}</div>
              </div>

              <div className="modal-actions">
                <button className="btn ghost" onClick={closeModal}>Close</button>
                <button className="btn primary" onClick={handleApprove}>Approve</button>
                <button className="btn danger" onClick={handleReject}>Reject</button>
              </div>
            </div>

            <div className="modal-body">
              <aside className="left-col">
                <div className="preview">
                  <button
                    className="nav-arrow left"
                    onClick={() => {
                      const idx = selected.images.indexOf(selectedImage);
                      const newIdx = (idx - 1 + selected.images.length) % selected.images.length;
                      setSelectedImage(selected.images[newIdx]);
                    }}
                  >&lt;</button>

                  <img src={selectedImage} alt="selected" />

                  <button
                    className="nav-arrow right"
                    onClick={() => {
                      const idx = selected.images.indexOf(selectedImage);
                      const newIdx = (idx + 1) % selected.images.length;
                      setSelectedImage(selected.images[newIdx]);
                    }}
                  >&gt;</button>
                </div>

                <div className="thumbs">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const img = selected.images[i];
                    return (
                      <button
                        key={i}
                        className={`thumb ${selectedImage === img ? "active" : ""}`}
                        onClick={() => img && setSelectedImage(img)}
                        disabled={!img}
                      >
                        {img ? <img src={img} alt={`thumb-${i}`} /> : <div className="empty-thumb" />}
                      </button>
                    );
                  })}
                </div>

              </aside>

              <section className="right-col">
                <div className="price-box">
                  <div className="price-row">
                    <div>
                      <small className="muted">rule price</small>
                      <div className="rule-price">{formatPrice(computedPriceFor(selected))}</div>
                    </div>

                    <div>
                      <small className="muted">override</small>
                      <div className="override">
                        <input
                          type="number"
                          className="override-input"
                          placeholder={`${computedPriceFor(selected)}`}
                          value={overridePrice}
                          onChange={(e) => setOverridePrice(e.target.value)}
                          disabled={!allowManual}
                        />
                        <span className="suffix">PKR</span>
                      </div>
                      <label className="manual-row">
                        <input type="checkbox" checked={allowManual} onChange={(e) => setAllowManual(e.target.checked)} />
                        <span className="muted">allow manual override</span>
                      </label>
                    </div>
                  </div>

                  <div className="final">
                    <small className="muted">final</small>
                    <div className="final-price">{formatPrice(overridePrice ? Number(overridePrice) : computedPriceFor(selected))}</div>
                  </div>

                  <div className="modal-cta">
                    <button className="btn" onClick={handleIssueCredit}>Issue Credit</button>
                    <button className="btn primary" onClick={handleApprove}>Approve</button>
                    <button className="btn danger" onClick={handleReject}>Reject</button>
                  </div>
                </div>

                <div className="meta">
                  <div><strong>Product</strong><div className="muted">{selected.product}</div></div>
                  <div><strong>Condition</strong><div className="muted">{selected.condition}</div></div>
                  <div><strong>Date</strong><div className="muted">{selected.date}</div></div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
