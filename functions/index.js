const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({origin: true});

admin.initializeApp();

exports.deleteUser = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({success: false,
        error: "Method Not Allowed"});
    }

    const {email, userId} = req.body;
    if (!email || !userId) {
      return res.status(400).json({success: false,
        error: "Email and User ID are required"});
    }

    try {
      // Get user by email
      const userRecord = await admin.auth().getUserByEmail(email);

      // Delete user from Firebase Authentication
      await admin.auth().deleteUser(userRecord.uid);

      return res.status(200).json({success: true,
        message: "User deleted successfully"});
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({success: false, error: error.message});
    }
  });
});
exports.deleteauthuser = functions.https.onCall((data, context) => {
  return admin.auth().getUserByEmail(data.email)
      .then((userRecord) => {
        return admin.auth().deleteUser(userRecord.uid);
      })
      .then(() => {
        return {success: true};
      })
      .catch((error) => {
        console.error("Error deleting user:", error);
        return {success: false, error: error.message};
      });
});

// Also add a HTTP version with CORS support for direct fetch calls
exports.deleteauthuser = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }
    const {email} = req.body;
    if (!email) {
      return res.status(400).send({error: "Email is required"});
    }
    return admin.auth().getUserByEmail(email)
        .then((userRecord) => {
          return admin.auth().deleteUser(userRecord.uid);
        })
        .then(() => {
          return res.status(200).send({success: true});
        })
        .catch((error) => {
          console.error("Error deleting user:", error);
          return res.status(500).send({success: false, error: error.message});
        });
  });
});

exports.listAllUsers = functions.https.onCall(async (data, context) => {
  // Check if request is authorized
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Only authenticated users can list users",
    );
  }

  try {
    const listUsersResult = await admin.auth().listUsers();
    const users = listUsersResult.users.map((userRecord) => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
    }));
    return {users};
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});

