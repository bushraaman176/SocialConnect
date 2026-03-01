import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { User } from '../types/auth';

export const signUp = async (email: string, password: string, name: string): Promise<User> => {
  try {
    console.log('Creating account with email:', email);
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    const { user } = userCredential;

    await user.updateProfile({ displayName: name });

    const userData: User = {
      uid: user.uid,
      email: user.email || email,
      displayName: name,
      photoURL: null,
      bio: '',
      createdAt: new Date(),
    };

    console.log('Saving user to Firestore:', userData);
    await firestore().collection('users').doc(user.uid).set(userData);
    console.log('User created successfully');

    return userData;
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    console.log('Signing in with email:', email);
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    const { user: firebaseUser } = userCredential;
    console.log('Firebase auth successful for user:', firebaseUser.uid);

    try {
      console.log('Fetching user document from Firestore...');
      const userDoc = await firestore().collection('users').doc(firebaseUser.uid).get();
      const docData = userDoc.data();
      
      console.log('Document exists:', userDoc.exists, 'Data:', docData);
      
      if (userDoc.exists && docData && Object.keys(docData).length > 0) {
        console.log('User data found in Firestore:', docData);
        return docData as User;
      } else {
        console.log('User document is empty or does not exist, creating one');
      }
    } catch (firestoreError) {
      console.warn('Error fetching from Firestore, will create new doc:', firestoreError);
    }

    // Create user document
    const userData: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || email,
      displayName: firebaseUser.displayName || 'User',
      photoURL: firebaseUser.photoURL || null,
      bio: '',
      createdAt: new Date(),
    };
    
    console.log('Creating user document in Firestore:', userData);
    await firestore().collection('users').doc(firebaseUser.uid).set(userData);
    console.log('User document created successfully');
    return userData;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await auth().signOut();
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await auth().sendPasswordResetEmail(email);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

export const updateProfile = async (uid: string, data: Partial<User>): Promise<void> => {
  try {
    // Update Firestore
    await firestore().collection('users').doc(uid).update(data);

    // Update Firebase Auth profile if needed
    const currentUser = auth().currentUser;
    if (currentUser && currentUser.uid === uid) {
      await currentUser.updateProfile({
        displayName: data.displayName,
        photoURL: data.photoURL,
      });
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const uploadProfileImage = async (uid: string, imageUri: string): Promise<string> => {
  try {
    const reference = storage().ref(`profile-images/${uid}`);
    await reference.putFile(imageUri);
    const downloadURL = await reference.getDownloadURL();
    return downloadURL;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return auth().onAuthStateChanged(async (firebaseUser: FirebaseAuthTypes.User | null) => {
    console.log('Auth state changed:', firebaseUser ? firebaseUser.uid : 'null');
    
    if (firebaseUser) {
      try {
        console.log('Fetching user from Firestore:', firebaseUser.uid);
        const userDoc = await firestore().collection('users').doc(firebaseUser.uid).get();
        const docData = userDoc.data();
        
        console.log('Document exists:', userDoc.exists, 'Has data:', !!docData, 'Keys:', docData ? Object.keys(docData).length : 0);
        
        if (userDoc.exists && docData && Object.keys(docData).length > 0) {
          console.log('User data found in Firestore:', docData);
          callback(docData as User);
          return;
        } else {
          console.log('User document is empty or does not exist, creating one');
        }
      } catch (error: any) {
        console.error('Error fetching from Firestore:', error);
      }

      // Create user document if it doesn't exist or is empty
      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || 'user@example.com',
        displayName: firebaseUser.displayName || 'User',
        photoURL: firebaseUser.photoURL || null,
        bio: '',
        createdAt: new Date(),
      };
      
      try {
        console.log('Creating user document:', userData);
        await firestore().collection('users').doc(firebaseUser.uid).set(userData);
        console.log('User document created successfully');
      } catch (error: any) {
        console.warn('Error creating user document:', error);
      }

      callback(userData);
    } else {
      console.log('User signed out');
      callback(null);
    }
  });
};

const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already in use. Please use a different email.';
    case 'auth/invalid-email':
      return 'Invalid email address. Please enter a valid email.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'firestore/unavailable':
      return 'Database service is temporarily unavailable. Please try again.';
    case 'firestore/permission-denied':
      return 'You do not have permission to access this resource.';
    default:
      return 'An error occurred. Please try again. Error code: ' + (errorCode || 'UNKNOWN');
  }
};