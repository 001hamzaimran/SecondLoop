import transporter from "./Email.js";

export async function sendDiscountEmail({ to, code, amount, productName }) {
    try {
        console.log(`Attempting to send email to: ${to}`);
        
        const from = process.env.EMAIL_FROM || "SecondLoop <no-reply@yourdomain.com>";
        const subject = `Your discount code from SecondLoop: ${code}`;
        
        const html = `
        <div style="font-family: Inter, system-ui, Arial; color:#111;">
            <h2>Hello!</h2>
            <p>We've approved your trade-in request for <strong>${productName}</strong>.</p>
            <p>Your one-time discount code: <strong style="font-size:24px; color: #2563eb;">${code}</strong></p>
            ${amount ? `<p>Value: <strong>PKR ${Number(amount).toLocaleString()}</strong></p>` : ""}
            <p>Use this code during checkout. This code can be used once per customer and will expire in 60 days.</p>
            <p>Thanks,<br/>SecondLoop Team</p>
        </div>
        `;

        const info = await transporter.sendMail({
            from,
            to,
            subject,
            html
        });

        console.log("Email sent successfully:", {
            messageId: info.messageId,
            to: to,
            code: code,
            response: info.response
        });

        return info;
    } catch (error) {
        console.error("Email sending failed:", {
            error: error.message,
            to: to,
            code: code
        });
        throw error;
    }
}

