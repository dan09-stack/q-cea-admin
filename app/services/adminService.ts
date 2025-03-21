import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Admin } from '../types/admin';

export const getAdminByEmail = async (email: string): Promise<Admin | null> => {
  try {
    const adminsRef = collection(db, 'admin');
    const q = query(adminsRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const adminData = querySnapshot.docs[0].data();
      return {
        id: querySnapshot.docs[0].id,
        email: adminData.email || '',
        fullName: adminData.fullName || '',     
        phone: adminData.phone || '', 
        role: adminData.role || '',
        status: adminData.status || ''
      };    
    }
    return null;
  } catch (error) {
    console.error('Error fetching admin data:', error);
    throw error;
  }
};
