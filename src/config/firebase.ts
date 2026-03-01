import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// No need to import 'initializeApp' or manually configure Firebase
// React Native Firebase automatically reads google-services.json (Android) 
// and GoogleService-Info.plist (iOS) to initialize the default app

// Export Firebase services for use in your app
export { auth, firestore, storage };