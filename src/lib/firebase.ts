import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const userDocumentPath = (userId: string) => `users/${userId}`;
export const userCollectionPath = (userId: string, collectionName: string) => `${userDocumentPath(userId)}/${collectionName}`;

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Error signing in with Google: ", error);
        const code = (error as any)?.code;
        if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
            await signInWithRedirect(auth, googleProvider);
            return null;
        }
        throw error;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out: ", error);
        throw error;
    }
};
