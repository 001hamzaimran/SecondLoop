import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import { ContextAuth } from "../contextApi/contextAuth";

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  const state = useContext(ContextAuth);
  const { store, setStore, tradeInReq, setTradeInRequests } = state;


  const totalRequests = tradeInReq?.length || 0;

  const pending = tradeInReq?.filter(
    (item) => item.status === "pending"
  ).length || 0;

  const approvedItems = tradeInReq?.filter(
    (item) => item.status === "approved"
  ) || [];

  const approved = approvedItems.length;

  // Estimated payout = sum of approvedPrice * quantity
  const estPayoutValue = approvedItems.reduce((total, item) => {
    const price = Number(item.approvedPrice) || 0;
    const qty = Number(item.quantity) || 1;
    return total + (price * qty);
  }, 0);

  // Format with currency (store currency if available)
  const currency = store?.currencyCode || "USD";

  const estPayout = `${estPayoutValue.toLocaleString()}`;

  console.log(estPayout)

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

  async function fetchTradeinRequests() {
    try {
      // const res = await fetch("/api/get-tradein-request/");
      const res = await fetch(`/api/get-tradein-request/${store?.domain || domain}`);
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
          product: shopifyProductName || "—",
          // keep raw products array if you need it in modal later
          products: item.products || [],
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

  console.log(tradeInReq, " <<<<<<< treadein req")

  return (
    <div className="dashboard">

      {/* ================= HERO ================= */}
      <div className="hero">
        <div className="hero-content">
          <span className="pill">Second Loop</span>
          <h1>Smarter trade-ins.<br />More revenue.</h1>

          <p>
            Manage trade-ins, verify conditions, and automate payouts —
            all from one clean Shopify dashboard.
          </p>

          <div className="actions">
            <button
              className="btn primary"
              onClick={() => navigate("/tradein")}
            >
              View Requests
            </button>
            <button
              className="btn secondary"
              onClick={() => setShowVideo(true)}
            >
              Demo Video
            </button>
          </div>
        </div>

        <div className="hero-metrics">
          <div className="metric-card">
            <h2>{totalRequests}</h2>
            <span>Total Requests</span>
          </div>

          <div className="metric-card highlight">
            <h2>{pending}</h2>
            <span>Pending</span>
          </div>

          <div className="metric-card success">
            <h2>{approved}</h2>
            <span>Approved</span>
          </div>

          <div className="metric-card payout">
            <span>{currency}</span>
            <h2 >{estPayout}</h2>
            <span> Est. Payout</span>
          </div>
        </div>
      </div>

      {/* ================= FEATURES ================= */}
      <div className="features">

        <div className="feature-card">
          <h3>Trade-In Requests</h3>
          <p>Review, approve, or reject customer trade-ins.</p>
          <button className="link" onClick={() => navigate("/tradein")}>
            Open requests →
          </button>
        </div>

        <div className="feature-card">
          <h3>Photo Verification</h3>
          <p>Quickly inspect uploaded images before approval.</p>
          <button className="link" onClick={() => navigate("/tradein")}>
            Review images →
          </button>
        </div>

        <div className="feature-card">
          <h3>Customized</h3>
          <p>Customized payback form colors.</p>
          <button
            className="link"
            onClick={() => navigate("/settings")}
          >
            Manage settings →
          </button>
        </div>

      </div>

      {showVideo && (
        <div className="video-modal" onClick={() => setShowVideo(false)}>
          <div
            className="video-box"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="video-close"
              onClick={() => setShowVideo(false)}
            >
              ✕
            </button>

            <iframe
              width="100%"
              height="400"
              src="https://www.youtube.com/embed/IbLitdFT0HE"
              title="Demo Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
