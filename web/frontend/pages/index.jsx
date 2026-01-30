// import {
//   Page,
//   Card,
//   Button,
//   Layout,
//   Text,
//   Stack,
//   Badge,
// } from "@shopify/polaris";
// import { useNavigate } from "react-router-dom";

// export default function HomePage() {
//   const navigate = useNavigate();

//   return (
//     <Page title="Dashboard">
//       <Layout>
//         {/* HERO SECTION */}
//         <Layout.Section>
//           <Card sectioned>
//             <Stack vertical spacing="extraLoose">
//               <Stack vertical spacing="tight">
//                 <Text as="h1" variant="headingXl">
//                   👋 Welcome to <strong>Second Loop</strong>
//                 </Text>

//                 <Text variation="subdued">
//                   The smartest way to manage trade-ins, verify product
//                   conditions, and turn returns into revenue.
//                 </Text>
//               </Stack>

//               <Stack spacing="tight">
//                 <Button
//                   primary
//                   size="large"
//                   onClick={() => navigate("/tradein")}
//                 >
//                   Start Trade-In
//                 </Button>

//               </Stack>
//             </Stack>
//           </Card>
//         </Layout.Section>

//         {/* FEATURES */}
//         <Layout.Section>
//           <Layout>
//             <Layout.Section oneThird>
//               <Card sectioned>
//                 <Stack vertical spacing="tight">
//                   <Text variant="headingSm">📦 Trade-In Orders</Text>
//                   <Text variation="subdued">
//                     Create, track, and manage customer trade-in requests.
//                   </Text>
//                   <Badge status="success">Core Feature</Badge>
//                 </Stack>
//               </Card>
//             </Layout.Section>

//             <Layout.Section oneThird>
//               <Card sectioned>
//                 <Stack vertical spacing="tight">
//                   <Text variant="headingSm">📸 Photo Verification</Text>
//                   <Text variation="subdued">
//                     Review uploaded images to verify product condition.
//                   </Text>
//                   <Badge status="info">Smart Review</Badge>
//                 </Stack>
//               </Card>
//             </Layout.Section>

//             <Layout.Section oneThird>
//               <Card sectioned>
//                 <Stack vertical spacing="tight">
//                   <Text variant="headingSm">💸 Payback Engine</Text>
//                   <Text variation="subdued">
//                     Automatically calculate trade-in value and payouts.
//                   </Text>
//                   <Badge status="attention">Revenue</Badge>
//                 </Stack>
//               </Card>
//             </Layout.Section>
//           </Layout>
//         </Layout.Section>
//       </Layout>
//     </Page>
//   );
// }
import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

export default function HomePage() {
  const navigate = useNavigate();

  const metrics = {
    totalRequests: 128,
    pending: 21,
    approved: 83,
    estPayout: "£3,420",
  };

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
              onClick={() => navigate("/tradeinrules")}
            >
              Pricing Rules
            </button>
          </div>
        </div>

        <div className="hero-metrics">
          <div className="metric-card">
            <h2>{metrics.totalRequests}</h2>
            <span>Total Requests</span>
          </div>

          <div className="metric-card highlight">
            <h2>{metrics.pending}</h2>
            <span>Pending</span>
          </div>

          <div className="metric-card success">
            <h2>{metrics.approved}</h2>
            <span>Approved</span>
          </div>

          <div className="metric-card payout">
            <h2>{metrics.estPayout}</h2>
            <span>Est. Payout</span>
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
          <h3>Payback Engine</h3>
          <p>Rules-based pricing with auto payout calculation.</p>
          <button
            className="link"
            onClick={() => navigate("/tradeinrules")}
          >
            Manage rules →
          </button>
        </div>

      </div>
    </div>
  );
}
