import { signInWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

const ADMIN_EMAIL = "q.cea2024@gmail.com";

/**
 * Ensures the user is signed out when the app starts.
 */
export const checkAuthState = () => {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        signOut(auth); // Force logout on load
      }
      resolve(null);
    });
  });
};

/**
 * Verifies admin credentials using Firebase Authentication.
 */
export const verifyAdminCredentials = async (email: string, password: string) => {
  try {
    if (email !== ADMIN_EMAIL) {
      return { success: false, error: "Unauthorized access" };
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return { success: true, admin: { email: user.email } };
  } catch (error) {
    return { success: false, error: "Invalid credentials" };
  }
};

/**
 * Sends a password reset email to the admin.
 */
export const resetAdminPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: 'Password reset email sent successfully' };
  } catch (error) {
    return { success: false, error: 'Failed to send reset email' };
  }
};
