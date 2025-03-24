const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.deleteAuthUser = functions.https.onCall(async (data, context) => {
  try {
    const email = data.email;
    if (!email) {
      throw new Error("Email is required");
    }

    // Find the user by email
    const userRecord = await admin.auth().getUserByEmail(email);

    // Delete the user
    await admin.auth().deleteUser(userRecord.uid);

    return {success: true, message: "User deleted successfully"};
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
