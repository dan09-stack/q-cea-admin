/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const cors = require("cors")({ origin: true });
const nodemailer = require("nodemailer");

initializeApp();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "q.cea2024@gmail.com",
    pass: "ewerxlsofuspnmbj",
  },
});

exports.sendEmail = onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).send("Invalid request body.");
    }

    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).send("Missing required fields.");
    }

    const mailOptions = {
      from: "your-email@gmail.com",
      to,
      subject: "Message from Admin",
      text: message,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).send("Email sent!");
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).send("Failed to send email.");
    }
  });
});

// // Create and deploy your first functions

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
