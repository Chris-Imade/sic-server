const express = require("express");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "5mb" }));

// Enable CORS for all routes
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.email,
    pass: process.env.emailPassword,
  },
});

// Event Registration Endpoint
app.post("/register", async (req, res) => {
  const { email, firstName, lastName, phone, attendanceType } = req.body;
  const qrCodePath = path.join(__dirname, "assets", "qrcode.png");

  // Event Ticket Email Template
  const eventTicketTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your SIC 2025 Ticket</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background: #ffffff;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                text-align: center;
            }
            .qr-code {
                width: 150px;
                height: 150px;
                background: #e0e0e0;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                border-radius: 8px;
                font-size: 14px;
                color: #666;
            }
            .ticket-details {
                text-align: left;
                padding: 10px 20px;
                background: #f9f9f9;
                border-radius: 8px;
            }
            h2 {
                color: #333;
            }
            .event-info {
                margin-top: 15px;
                text-align: center;
                color: #555;
            }
            .footer {
                margin-top: 20px;
                font-size: 12px;
                color: #777;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Your Ticket for SIC 2025</h2>
            <div class="qr-code">
                <img src="cid:qrcode" alt="QR Code" style="width:150px; height:150px; margin-bottom: 20px;">
            </div>
            <div class="ticket-details">
                <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Ticket ID:</strong> ${Math.floor(
                  Math.random() * 50
                )}${Math.floor(Math.random() * 50)}${Math.floor(
    Math.random() * 50
  )}${Math.floor(Math.random() * 50)}${Math.floor(
    Math.random() * 50
  )}${Math.floor(Math.random() * 50)}${Math.floor(
    Math.random() * 50
  )}${Math.floor(Math.random() * 50)}</p>
                <p><strong>Event:</strong> Scale and Ideas Conference 2025</p>
                <p><strong>Date:</strong> May 16-17, 2025</p>
            </div>
            <div class="event-info">
                <p>Present this ticket at the venue for entry.</p>
                <p>For any inquiries, contact us at <a href="mailto:info@sic.com">info@sic.com</a></p>
            </div>
            <div class="footer">
                <p>&copy; 2025 Scale and Ideas Conference. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  // Admin Notification Email Template
  const adminNotificationTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>New Event Registration</title>
    </head>
    <body>
      <h2>New Event Registration Received</h2>
      <p><strong>First Name:</strong> ${firstName}</p>
      <p><strong>Last Name:</strong> ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Attendance Type:</strong> ${attendanceType}</p>
    </body>
    </html>
  `;

  try {
    // Send ticket to registrant
    const ticketEmail = await transporter.sendMail({
      from: "info@sic.africa",
      to: email,
      subject: "SIC Africa Event Registration Confirmation",
      html: eventTicketTemplate,
      attachments: [
        {
          filename: "qrcode.png",
          path: qrCodePath,
          cid: "qrcode",
        },
      ],
    });

    // Send notification to admin
    const adminEmail = await transporter.sendMail({
      from: "info@sic.africa",
      to: "info@sic.africa",
      subject: "New Event Registration",
      html: adminNotificationTemplate,
    });

    console.log(
      "Registration emails sent:",
      ticketEmail.messageId,
      adminEmail.messageId
    );

    res.status(200).send({
      message: "Registration successful",
      status: 200,
    });
  } catch (error) {
    console.error("Error processing registration:", error);
    res.status(500).send({
      message: "Error submitting registration",
      status: 500,
      error: error.message,
    });
  }
});

// Existing Contact Route (with modifications)
app.post("/contact", async (req, res) => {
  const { name, phone, email, subject, comment } = req.body;

  // Admin Notification Template
  const adminContactTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>New Contact Form Submission</title>
    </head>
    <body>
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${comment}</p>
    </body>
    </html>
  `;

  const contactReplyTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You for Contacting SIC Africa</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
          background-color: #3855b3;
          color: white;
          text-align: center;
          padding: 20px;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }
        .body {
          padding: 20px;
          line-height: 1.6;
        }
        .footer {
          background-color: #f4f4f4;
          text-align: center;
          padding: 15px;
          font-size: 12px;
          color: #666;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>Thank You for Reaching Out</h1>
        </div>
        <div class="body">
          <p>Dear ${name},</p>
          <p>Thank you for contacting SIC Africa. We have received your message and appreciate you taking the time to reach out to us.</p>
          <p>Our team is committed to providing excellent customer service. We will review your inquiry and respond within 24 hours.</p>
          <p>If your matter is urgent, please feel free to call our customer support team.</p>
          <p>Best regards,<br>SIC Africa Team</p>
        </div>
        <div class="footer">
          <p>&copy; 2025 SIC Africa. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    // Send contact form details to admin
    const adminNotification = await transporter.sendMail({
      from: "info@sic.africa",
      to: "info@sic.africa",
      subject: "New Contact Form Submission",
      html: adminContactTemplate,
    });

    // Send confirmation to the person who submitted the contact form
    const contactReply = await transporter.sendMail({
      from: "info@sic.africa",
      to: email,
      subject: "We Received Your Message",
      html: contactReplyTemplate,
    });

    console.log(
      "Contact emails sent:",
      adminNotification.messageId,
      contactReply.messageId
    );

    res.status(200).send({
      message: "Contact form submitted successfully",
      status: 200,
    });
  } catch (error) {
    console.error("Error sending contact emails:", error);
    res.status(500).send({
      message: "Error submitting contact form",
      status: 500,
      error: error.message,
    });
  }
});

// Root Route
app.get("/", (req, res) => {
  res.send("SIC Africa Server is running ✨");
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";
  res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    stack: err.stack,
  });
});

// Start Server
const PORT = process.env.PORT || 4500;
app.listen(PORT, () => {
  console.log(`Server Running on PORT ${PORT}`);
});
