import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

/**
 * Verifies admin credentials by checking email and password in Firestore.
 */
export const verifyAdminCredentials = async (email: string, password: string) => {
  try {
    const adminRef = collection(db, 'admin');
    const q = query(
      adminRef,
      where('email', '==', email),
      where('password', '==', password)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const adminData = querySnapshot.docs[0].data();
      return { success: true, admin: adminData };
    }
    return { success: false, error: 'Invalid credentials' };
  } catch (error) {
    return { success: false, error: 'Authentication failed' };
  }
};

/**
 * Resets the admin password to "admin" by updating it in Firestore.
 */
export const resetAdminPassword = async (email: string) => {
  try {
    const adminRef = collection(db, 'admin');
    const q = query(adminRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const adminDoc = querySnapshot.docs[0]; 
      const adminDocRef = doc(db, 'admin', adminDoc.id);

      // Set the password to "admin"
      await updateDoc(adminDocRef, { password: "admin" });

      return { success: true, message: 'Password reset to "admin" successfully' };
    }
    return { success: false, error: 'Admin not found' };
  } catch (error) {
    return { success: false, error: 'Password reset failed' };
  }
};
