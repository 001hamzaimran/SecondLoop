import transporter from "./Email.js";

export async function sendDiscountEmail({ to, code, amount, productName, store }) {
    try {
        const {
            country,
            currencyCode,
            domain,
            email,
            storeName
        } = store;

        console.log(`Attempting to send email to: ${to}`);

        const formattedAmount = amount
            ? `${currencyCode || ""} ${Number(amount).toLocaleString()}`
            : null;

        const from = `"${storeName || "Store"}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`;

        const subject = `Your discount code from ${storeName || "Our Store"}: ${code}`;

        const html = `
        <div style="font-family: Inter, system-ui, Arial; color:#111; line-height:1.6;">
            
            <h2>Congrats!</h2>

            <p>
                We've approved your trade-in request for 
                <strong>${productName}</strong>.
            </p>

            <p>
                Your one-time discount code:
            </p>

            <p style="font-size:24px; font-weight:bold; color:#2563eb;">
                ${code}
            </p>

            ${formattedAmount ? `
                <p>
                    <strong>Value:</strong> ${formattedAmount}
                </p>
            ` : ""}

            <p>
                Use this code during checkout. This code can be used once
                and will expire in 60 days.
            </p>

            <hr style="margin:25px 0;" />

            <h3>Store Information</h3>
            <p>
                <strong>Store Name:</strong> ${storeName || "-"}<br/>
                <strong>Email:</strong> ${email || "-"}<br/>
                <strong>Domain:</strong> ${domain || "-"}<br/>
                <strong>Country:</strong> ${country || "-"}<br/>
                <strong>Currency:</strong> ${currencyCode || "-"}
            </p>

            <br/>

            <p>
                Thank you for choosing 
                <strong>${storeName || "our store"}</strong>.
            </p>

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
            to,
            code,
            response: info.response
        });

        return info;

    } catch (error) {
        console.error("Email sending failed:", {
            error: error.message,
            to,
            code
        });
        throw error;
    }
}
