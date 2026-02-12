import transporter from "./Email.js";

export async function sendCODEmail({ to, amount, name }) {
  try {
    const formattedAmount = amount
      ? `$ ${Number(amount).toLocaleString()}`
      : "—";

    const subject = "Your Trade-In Request Has Been Approved";

    const text = `
Dear ${name || "Customer"},

We are pleased to inform you that your trade-in request has been approved.

Approved Amount: ${formattedAmount}

To proceed with the payment, please reply to this email with your bank account details. 
Alternatively, you may collect the payment in cash from our office.

Once we receive and verify the delivery of your product, the approved amount will be transferred to you promptly.

If you have any questions, feel free to contact us.

Thank you for choosing Second Loop.

Best regards,  
Second Loop Team
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

        <p>
          If you have any questions or need assistance, please feel free to contact us.
        </p>

        <br/>

        <p>
          Thank you for choosing <strong>Second Loop</strong>.<br/>
          <strong>Second Loop Team</strong>
        </p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Second Loop" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
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
