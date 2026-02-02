// Utils/email.js
import nodemailer from "nodemailer";

// Email configuration debug
console.log("Email Config Debug:");
console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("EMAIL_FROM:", process.env.EMAIL_FROM);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Verify connection configuration
transporter.verify(function(error, success) {
    if (error) {
        console.error("SMTP Connection Error:", error);
    } else {
        console.log("SMTP Server is ready to take our messages");
    }
})

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
            <p>Use this code during checkout. This code can be used once per customer and will expire in 14 days.</p>
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

// export async function sendDiscountEmail({ to, code, amount, productName }) {
//     const from = process.env.EMAIL_FROM || "SecondLoop <jawad.dev4@gmail.com>";
//     const subject = `Your discount code from SecondLoop: ${code}`;
//     const html = `
//     <div style="font-family: Inter, system-ui, Arial; color:#111;">
//       <h2>Hello!</h2>
//       <p>We've approved your trade-in request for <strong>${productName}</strong>.</p>
//       <p>Your one-time discount code: <strong style="font-size:18px">${code}</strong></p>
      
//       <p>Use this on checkout. This code can be used once per customer and will expire soon.</p>
//       <p>Thanks,<br/>${amount ? `<p>Value: <strong>PKR ${Number(amount).toLocaleString()}</strong></p>` : ""}SecondLoop Team</p>
//     </div>
//   `;

//     const info = await transporter.sendMail({
//         from,
//         to,
//         subject,
//         html
//     });

//     return info;
// }
