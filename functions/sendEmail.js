const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

// Configure nodemailer with your email credentials
const transporter = nodemailer.createTransport({
  service: "gmail", // You can use other email providers
  auth: {
    user: "your-email@gmail.com", // Replace with your email
    pass: "your-email-password", // Use App Passwords for security
  },
});

exports.sendEmail = functions.https.onCall(async (data, context) => {
  const { recipientEmail, message } = data;

  if (!recipientEmail || !message) {
    throw new functions.https.HttpsError("invalid-argument", "Missing email or message.");
  }

  const mailOptions = {
    from: "your-email@gmail.com",
    to: recipientEmail,
    subject: "Notification from Profile",
    text: message,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Email sent successfully!" };
  } catch (error) {
    throw new functions.https.HttpsError("internal", "Failed to send email.", error);
  }
});
