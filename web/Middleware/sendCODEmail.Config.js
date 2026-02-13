import transporter from "./Email.js";

export async function sendCODEmail({ to, amount, name, store }) {
  try {
    const {
      country,
      currencyCode,
      domain,
      email,
      storeName
    } = store;

    const formattedAmount = amount
      ? `${currencyCode || "$"} ${Number(amount).toLocaleString()}`
      : "—";

    const subject = "Your Trade-In Request Has Been Approved";

    const text = `
Dear ${name || "Customer"},

We are pleased to inform you that your trade-in request has been approved.

Approved Amount: ${formattedAmount}

To proceed with the payment, please reply to this email with your bank account details. 
Alternatively, you may collect the payment in cash from our office.

Once we receive and verify the delivery of your product, the approved amount will be transferred to you promptly.

-----------------------------------
Store Information:
Store Name: ${storeName || "Second Loop"}
Store Email: ${email || "-"}
Store Domain: ${domain || "-"}
Country: ${country || "-"}
Currency: ${currencyCode || "-"}
-----------------------------------

Thank you for choosing ${storeName || "Second Loop"}.

Best regards,  
${storeName || "Second Loop"} Team
`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color:#2c3e50;">Trade-In Approved ✅</h2>

        <p>Dear <strong>${name || "Customer"}</strong>,</p>

        <p>
          We are pleased to inform you that your trade-in request has been 
          <strong>successfully approved</strong>.
        </p>

        <p style="font-size:16px;">
          <strong>Approved Amount:</strong> 
          <span style="color:#27ae60; font-size:18px;">
            ${formattedAmount}
          </span>
        </p>

        <p>
          To proceed with the payment, please reply to this email with your 
          bank account details. Alternatively, you may collect the payment 
          in cash from our office.
        </p>

        <p>
          Once we receive and verify the delivery of your product, 
          the approved amount will be transferred to you promptly.
        </p>

        <hr style="margin:20px 0;" />

        <h3 style="color:#2c3e50;">Store Information</h3>
        <p>
          <strong>Store Name:</strong> ${storeName || "Second Loop"}<br/>
          <strong>Store Email:</strong> ${email || "-"}<br/>
          <strong>Store Domain:</strong> ${domain || "-"}<br/>
          <strong>Country:</strong> ${country || "-"}<br/>
          <strong>Currency:</strong> ${currencyCode || "-"}
        </p>

        <br/>

        <p>
          Thank you for choosing <strong>${storeName || "Second Loop"}</strong>.<br/>
          <strong>${storeName || "Second Loop"} Team</strong>
        </p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${storeName || "Second Loop"}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("✅ COD Email sent:", info.messageId);

    return info;

  } catch (error) {
    console.error("❌ COD Email failed:", error);
    throw error;
  }
}
