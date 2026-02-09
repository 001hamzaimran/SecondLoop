import React, { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify"
import "./Tradein.css";

export default function Tradein() {
  // price rules (you can replace with API values)
  const DEFAULT_PRICES = { good: 5000, fair: 3000, poor: 1000 };

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [overridePrice, setOverridePrice] = useState("");
  const [allowManual, setAllowManual] = useState(true);

  // NEW: percentage state (0-100). default 100 (full)
  const [percentage, setPercentage] = useState(10);

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

  async function fetchTradeinRequests() {
    try {
      const res = await fetch("/api/get-tradein-request");
      const data = await res.json();

      if (!data.success) {
        toast.error("Failed to load trade-in requests");
        return;
      }

      // 👇 DB → UI mapping
      const formatted = data.data.map((item) => ({
        id: item._id,
        customer: item.name,
        email: item.email,
        product: item.productName,
        condition: item.condition,
        status: item.status,
        date: new Date(item.createdAt).toISOString().slice(0, 10),
        images: item.images?.length
          ? item.images.map((img) => img.url || img)
          : [],
        basePrice: item.basePrice,
        quantity: item.quantity,
        description: item.description,
        percentage: item.percentage,
        approvedPrice: item.approvedPrice,
        approvedCode: item.approvedCode
      }));

      setRequests(formatted);
    } catch (err) {
      console.error(err);
      toast.error("Server error while loading requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTradeinRequests();
  }, []);

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
    setPercentage(request.percentage);
  }

  function closeModal() {
    setModalOpen(false);
    setSelected(null);
    setSelectedImage(null);
    setPercentage(10);
    setOverridePrice("");
  }

  function setStatus(id, status, finalPrice = null) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, approvedPrice: finalPrice ?? r.approvedPrice } : r
      )
    );
  }

  // function handleApprove() {
  //   if (!selected) return;
  //   const final = overridePrice ? Number(overridePrice) : computedPriceFor(selected);
  //   setStatus(selected.id, "approved", final);
  //   toast.success("Request Approved Successfully")
  //   closeModal();
  // }

  async function handleApprove() {
    if (!selected) return;

    // const final = overridePrice ? Number(overridePrice) : computedPriceFor(selected);
    const final = overridePrice ? Number(overridePrice) : Math.round((Number(percentage) / 100) * (selected.basePrice || 0));

    try {
      setLoading(true);
      const res = await fetch("/api/update-tradein-request-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, status: "approved", approvedPrice: final, percentage: Number(percentage) }),
      });
      const data = await res.json();

      //     if (data.success) {
      //       toast.success(`Approved — code ${data.data.approvedCode} sent to ${selected.email}`);
      //       setStatus(selected.id, "approved", final);
      //       toast.success("Request Approved Successfully");
      //       closeModal();
      //     } else {
      //       toast.error("Failed to approve request");
      //     }
      //   } catch (err) {
      //     console.error(err);
      //     toast.error("Server error while approving request");
      //   } finally {
      //     setLoading(false);
      //   }
      // }

      if (data.success) {
        // server returns discountCode under data.data.discountCode or data.data.approvedCode depending on your backend
        const code = data.data?.discountCode || data.data?.approvedCode || "(code)";
        toast.success(`Approved — code ${code} sent to ${selected.email}`);
        setStatus(selected.id, "approved", final);
        closeModal();
      } else {
        toast.error("Failed to approve request: " + (data.message || "unknown"));
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error while approving request");
    } finally {
      setLoading(false);
    }
  }



  async function handleReject() {
    if (!selected) return;
    try {
      setLoading(true);
      const res = await fetch("/api/update-tradein-request-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, status: "rejected" }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus(selected.id, "rejected");
        toast.error("Request Rejected Successfully");
        closeModal();
      } else {
        toast.error("Failed to reject request");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error while rejecting request");
    } finally {
      setLoading(false);
    }
  }


  // async function handleIssueCredit() {
  //   if (!selected) return;

  //   const final = overridePrice
  //     ? Number(overridePrice)
  //     : Math.round((Number(percentage) / 100) * (selected.basePrice || 0));

  //   try {
  //     setLoading(true);

  //     const res = await fetch("/api/create-giftcard", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         id: selected.id,
  //         amount: final,
  //         message: `Your trade-in credit of PKR ${final} has been issued.`
  //       }),
  //     });

  //     const data = await res.json();

  //     if (data.success) {
  //       // update UI local state
  //       setStatus(selected.id, "approved", final);

  //       // If backend returned a code (rare), show it — otherwise show amount + email info
  //       const returnedCode = data.data?.shopifyPayload?.giftCardCode || data.data?.payback?.approvedCode;
  //       if (returnedCode) {
  //         toast.success(`Approved — Gift card code ${returnedCode} sent to ${selected.email}`);
  //       } else {
  //         toast.success(`Approved — Gift card of PKR ${final} sent to ${selected.email}`);
  //       }

  //       closeModal();
  //     } else {
  //       toast.error("Failed to create gift card: " + (data.message || "unknown"));
  //     }
  //   } catch (err) {
  //     console.error("Issue credit error:", err);
  //     toast.error("Server error while issuing gift card");
  //   } finally {
  //     setLoading(false);
  //   }
  // }


  // small counts

  async function handleIssueCredit() {
    if (!selected) return;

    const final = overridePrice
      ? Number(overridePrice)
      : Math.round((Number(percentage) / 100) * (selected.basePrice || 0));

    try {
      setLoading(true);

      const res = await fetch("/api/create-giftcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          amount: final,
          message: `Your trade-in credit of PKR ${final} has been issued. Thank you for using Second Loop!`
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Update UI
        setStatus(selected.id, "approved", final);

        // Show success message
        const code = data.data?.giftCardCode || data.data?.payback?.approvedCode;
        if (code) {
          toast.success(`✅ Gift card created! Code: ${code}`);
        } else {
          toast.success(`✅ Gift card of PKR ${final} created successfully!`);
        }

        closeModal();
      } else {
        toast.error(`❌ Failed: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Issue credit error:", err);
      toast.error("Server error while issuing gift card");
    } finally {
      setLoading(false);
    }
  }

  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const displayFinal = (selected ? (overridePrice ? Number(overridePrice) : Math.round((Number(percentage) / 100) * (selected.basePrice || 0))) : 0);

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
            <option value="all">All status</option>
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
            {loading && (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "30px" }}>
                  Loading trade-in requests...
                </td>
              </tr>
            )}
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
                      {/* <div className="computed">{formatPrice(cp)}</div> */}
                      <div className="computed">{r?.basePrice}</div>
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
                <button className="btn primary" onClick={handleApprove}>{loading ? "Approving..." : "Approve"}</button>
                <button className="btn danger" onClick={handleReject}>{loading ? "Rejecting..." : "Reject"}</button>
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
                      {/* <div className="rule-price">{formatPrice(computedPriceFor(selected))}</div> */}
                      <div className="rule-price">{selected?.basePrice}</div>
                    </div>

                    <div>
                      {/* <small className="muted">override</small>
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
                      </div> */}

                      {/* NEW: percentage input */}
                      <div style={{ marginTop: 8 }}>
                        <small className="muted">percentage (0-100)</small>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={percentage}
                            onChange={(e) => {
                              let v = Number(e.target.value);
                              if (Number.isNaN(v)) v = 0;
                              if (v > 100) v = 100;
                              if (v < 0) v = 0;
                              setPercentage(v);
                            }}
                            style={{ width: 90, padding: "6px 8px", borderRadius: 6 }}
                          />
                          <span className="muted">%</span>
                        </div>
                      </div>

                      {/* <label className="manual-row" style={{ marginTop: 8 }}>
                        <input type="checkbox" checked={allowManual} onChange={(e) => setAllowManual(e.target.checked)} />
                        <span className="muted">allow manual override</span>
                      </label> */}
                    </div>
                  </div>


                  <div className="final">
                    <small className="muted">final</small>
                    {/* <div className="final-price">{formatPrice(overridePrice ? Number(overridePrice) : computedPriceFor(selected))}</div> */}
                    {/* <div className="final-price">PKR: {selected?.basePrice}</div> */}
                    <div className="final-price">PKR: {displayFinal}</div>
                  </div>

                  <div className="modal-cta">
                    <button className="btn" onClick={handleIssueCredit}>
                      {loading ? "Issuing..." : "Issue Gift Card"}
                    </button>
                    <button disabled={loading} className="btn primary" onClick={handleApprove}>{
                      loading ? "Approving..." : "Approve"
                    }</button>
                    <button className="btn danger" onClick={handleReject}>{loading ? "Rejecting..." : "Reject"}</button>
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
