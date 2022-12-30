import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyC52K8SRzuu80VdHSW163x-o1eYAi2-6Q4',
    authDomain: 'house-marketplace-app-fe.firebaseapp.com',
    projectId: 'house-marketplace-app-fe',
    storageBucket: 'house-marketplace-app-fe.appspot.com',
    messagingSenderId: '259009769416',
    appId: '1:259009769416:web:133b64134ae0c4766f9afd',
}

// Initialize Firebase
initializeApp(firebaseConfig)
export const db = getFirestore()
