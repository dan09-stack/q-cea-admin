import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

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
