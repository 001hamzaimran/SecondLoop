import React, { useState, useMemo, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import "./Tradein.css";
import { ContextAuth } from "../contextApi/contextAuth"

export default function Tradein() {
  // price rules (you can replace with API values)
  const DEFAULT_PRICES = { new: 7000, good: 5000, fair: 3000, poor: 1000 };

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejLoading, setRejLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const state = useContext(ContextAuth);
  const { store, setStore, tradeInReq, setTradeInRequests } = state;

  const { country, createdAt, currencyCode, domain, email, storeName, updatedAt, _id } = store;

  console.log(store, "<<< trrade in page store data ")

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [overridePrice, setOverridePrice] = useState("");
  const [allowManual, setAllowManual] = useState(true);


  // get ALL product names for modal
  function getAllProductNames(products = []) {
    if (!Array.isArray(products)) return "";

    const names = products
      .map(p => (p.productName || "").trim())
      .filter(Boolean);

    // remove duplicates
    const unique = [...new Set(names)];

    return unique.join(" || ");
  }

  console.log("selected", selected);

  // Helper: return the first Shopify product's name (or empty string)
  function getShopifyProductName(products = []) {
    if (!Array.isArray(products)) return "";

    const shopifyProduct = products.find(
      (p) =>
        p &&
        typeof p.productId === "string" &&
        p.productId.startsWith("gid://shopify/Product/")
    );

    return shopifyProduct?.productName || "";
  }

  // NEW: approve action selector: "discount" or "giftcard"
  const [approveAction, setApproveAction] = useState("discount");

  // derived list
  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        (r.customer || "").toLowerCase().includes(q) ||
        (r.product || "").toLowerCase().includes(q) ||
        (r.orderId || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q)
      );
    });
  }, [requests, query, filterStatus]);

  async function fetchTradeinRequests() {
    try {
      const res = await fetch("/api/get-tradein-request");
      const data = await res.json();

      console.log(data.data, "<<<< data is here");

      if (!data.success) {
        toast.error("Failed to load trade-in requests");
        return;
      }

      // Map DB -> UI, show ONLY Shopify product name
      const formatted = data.data.map((item) => {
        const shopifyProductName = getShopifyProductName(item.products);

        return {
          id: item._id,
          customer: item.name,
          email: item.email,
          // ONLY the Shopify product name (or a placeholder)
          product: shopifyProductName || item.productName || "—",
          // keep raw products array if you need it in modal later
          products: item.products || [],
          orderId: item.orderId,
          condition: item.condition,
          status: item.status,
          date: new Date(item.createdAt).toISOString().slice(0, 10),
          images: item.images?.length ? item.images.map((img) => img.url || img) : [],
          basePrice: item.basePrice,
          quantity: item.quantity,
          description: item.description,
          percentage: item.percentage,
          approvedPrice: item.approvedPrice,
          approvedCode: item.approvedCode,
          shopifyCustomerId: item.shopifyCustomerId,
          hasBox: item.hasBox,
          paymentMethod: item.paymentMethod
        };
      });

      setRequests(formatted);
      setTradeInRequests(formatted);
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
    if (typeof n === "number") return n.toLocaleString();
    return n;
  }

  function computedPriceFor(request) {
    const k = (request.condition || "").toLowerCase();
    return DEFAULT_PRICES[k] ?? 0;
  }

  function openModal(request) {
    setSelected(request);
    const firstImg = request.images && request.images.length ? request.images[0] : null;
    setSelectedImage(firstImg);
    setOverridePrice(""); // reset override each time
    setModalOpen(true);
    setApproveAction("discount"); // default selection when opening
  }

  function closeModal() {
    setModalOpen(false);
    setSelected(null);
    setSelectedImage(null);
    setOverridePrice("");
    setApproveAction("discount");
  }

  function setStatus(id, status, finalPrice = null) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, approvedPrice: finalPrice ?? r.approvedPrice } : r
      )
    );
  }

  async function handleApprove() {
    if (!selected) return;

    const final = overridePrice ? Number(overridePrice) : selected?.basePrice ?? 0;

    try {
      setLoading(true);
      const res = await fetch("/api/update-tradein-request-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          status: "approved",
          paymentMethod: "discount",
          approvedPrice: final,
          store,
        }),
      });
      const data = await res.json();

      if (data.success) {
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
      setRejLoading(true);
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
      setRejLoading(false);
    }
  }

  async function handleIssueCredit() {
    if (!selected) return;

    const final = overridePrice ? Number(overridePrice) : selected?.basePrice ?? 0;

    try {
      setLoading(true);

      const res = await fetch("/api/create-giftcard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected?.id,
          amount: final,
          paymentMethod: "giftcard",
          store,
          message: `Your trade-in credit of ${final} has been issued. Thank you for using Second Loop!`,
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
          toast.success(`✅ Gift card of ${final} created successfully!`);
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

  async function handleApproveCOD() {
    if (!selected) return;
    const final = overridePrice ? Number(overridePrice) : selected?.basePrice ?? 0;

    try {
      setLoading(true);
      const res = await fetch("/api/update-tradein-request-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          status: "approved",
          approvedPrice: final,
          paymentMethod: "cod",
          store,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setStatus(selected.id, "approved", final);
        toast.success("Approved — COD selected. Email sent to user with instructions.");
        closeModal();
      } else {
        toast.error("Failed to approve COD: " + (data.message || "unknown"));
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error while approving COD");
    } finally {
      setLoading(false);
    }
  }


  // new helper: contextual approve action
  async function handleApproveOrAction() {
    // If admin selected "giftcard" in dropdown, call the giftcard function
    if (approveAction === "giftcard") {
      await handleIssueCredit();
    } else if (approveAction === "cod") {
      await handleApproveCOD();
    } else {
      // default -> discount code flow
      await handleApprove();
    }
  }

  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const displayFinal = selected ? (overridePrice ? Number(overridePrice) : selected?.basePrice ?? 0) : 0;

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
              <th>payment Method</th>
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
                        <div className="id muted">{r.orderId}</div>
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
                      <div className="computed">{r?.paymentMethod || "N/A"}</div>
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
            {filtered.length === 0 && !loading && (
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
                <div className="muted">{selected.customer} • {selected.email}</div>
              </div>

              <div className="modal-actions">
                <button className="btn ghost" onClick={closeModal}>Close</button>
                {/* Removed the old Approve/Reject from head to keep UI simple */}
              </div>
            </div>

            <div className="modal-body">
              <aside className="left-col">
                <div className="preview">
                  <button
                    className="nav-arrow left"
                    onClick={() => {
                      const imgs = selected.images || [];
                      if (!imgs.length) return;
                      const idx = imgs.indexOf(selectedImage);
                      const newIdx = (idx - 1 + imgs.length) % imgs.length;
                      setSelectedImage(imgs[newIdx]);
                    }}
                    disabled={!selected.images || selected.images.length <= 1}
                  >&lt;</button>

                  {selectedImage ? <img src={selectedImage} alt="selected" /> : <div className="placeholder">No image</div>}

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
                      {/* <small className="muted">Box</small> */}
                      <div className="rule-price">
                        {selected?.hasBox
                          ? <span className="chip success">Has box</span>
                          : <span className="chip muted">No box</span>
                        }
                      </div>
                    </div>

                    <div>
                      <div style={{ marginTop: 8 }}>
                        <small className="muted">Amount</small>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={selected?.status === "approved" ? selected?.approvedPrice : "0.00"}
                            value={overridePrice}
                            onChange={(e) => {
                              // allow empty, otherwise numeric
                              const v = e.target.value;
                              if (v === "") return setOverridePrice("");
                              // sanitize to number string
                              const n = Number(v);
                              if (Number.isNaN(n)) return;
                              setOverridePrice(String(n));
                            }}
                            style={{ width: 140, padding: "6px 8px", borderRadius: 6 }}
                          />
                          {/* <span className="muted">PKR</span> */}
                        </div>
                        <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                          Enter the exact amount to issue.
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="final">
                    <strong className="muted">final</strong>
                    <div className="final-price">
                      {selected?.status === "approved" ? `${currencyCode}:${selected?.approvedPrice}` : `${currencyCode}: ${overridePrice || "0.00"}`}
                      {/* {formatPrice(displayFinal ? displayFinal : selected?.basePrice ?? 0)} */}
                    </div>
                  </div>

                  <div className="modal-cta" style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                    {/* Dropdown to pick action for Approve button */}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong className="muted " style={{ marginBottom: "5px" }}>On Approve</strong>
                      <select
                        value={approveAction}
                        onChange={(e) => setApproveAction(e.target.value)}
                        style={{ padding: "6px 8px", borderRadius: 6 }}
                        disabled={loading}
                      >
                        <option value="discount">Create Discount Code</option>
                        <option value="giftcard">Issue Gift Card</option>
                        <option value="cod">Cash on Delivery (COD)</option>
                      </select>
                    </div>

                    {/* Approve button: will run discount or giftcard depending on dropdown */}
                    <button
                      className="btn primary"
                      onClick={handleApproveOrAction}
                      disabled={loading}
                    >
                      {loading
                        ? approveAction === "giftcard"
                          ? "Issuing Gift Card..."
                          : approveAction === "cod"
                            ? "Approving (COD)..."
                            : "Creating Discount..."
                        : "Approve"}
                    </button>

                    {/* Reject button */}
                    <button
                      className="btn danger"
                      onClick={handleReject}
                      disabled={rejLoading}
                    >
                      {rejLoading ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                </div>

                <div className="meta">
                  <div className="product-tags">
                    <strong>Product:</strong>
                    {selected.products
                      .filter(p => p.productName)
                      .map((p, i) => (
                        <span key={i} className="tag">
                          {p.productName}
                        </span>
                      ))}
                  </div>
                  <div><strong>Payment Method:</strong><div className="muted">{selected.paymentMethod}</div></div>
                  <div><strong>Condition:</strong><div className="muted">{selected.condition}</div></div>
                  <div><strong>Date:</strong><div className="muted">{selected.date}</div></div>
                  <div><strong>Payment Method:</strong><div className="muted">{selected.paymentMethod}</div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
