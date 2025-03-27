const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Allow all origins and include specific headers (like Authorization)
const corsHandler = cors({
  origin: true,  // Allow all origins
  allowedHeaders: ['Content-Type', 'Authorization'],  // Allow 'Authorization' header
});

exports.deleteAuthUser = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    console.log("Received request:", req.body);

    if (req.method !== "POST") {
      console.error("Invalid method:", req.method);
      return res.status(405).send({ error: "Method Not Allowed" });
    }

    const { email } = req.body.data || {};  // Safely accessing email within 'data'

    if (!email) {
      console.error("No email provided");
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      console.log(`Fetching user by email: ${email}`);
      const user = await admin.auth().getUserByEmail(email);
      console.log(`User found: ${user.uid}`);

      await admin.auth().deleteUser(user.uid);
      console.log(`User ${email} deleted successfully`);

      return res.json({ success: true, message: `User ${email} deleted` });
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ error: error.message });
    }
  });
});
