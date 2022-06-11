// import { initializeApp } from 'firebase/app'
// import { getFirestore } from 'firebase/firestore'

// // Your web app's Firebase configuration
// // const firebaseConfig = {
// //     apiKey: 'AIzaSyDA8LVcBB6ZuFMGtZZLEh_veJ44WGrNRdE',
// //     authDomain: 'house-marketplace-app-fb1d0.firebaseapp.com',
// //     projectId: 'house-marketplace-app-fb1d0',
// //     storageBucket: 'house-marketplace-app-fb1d0.appspot.com',
// //     messagingSenderId: '832068369979',
// //     appId: '1:832068369979:web:dce177da9bfc60a4b4e61e',
// // }
// const firebaseConfig = {
//     apiKey: 'AIzaSyC52K8SRzuu80VdHSW163x-o1eYAi2-6Q4',
//     authDomain: 'house-marketplace-app-fe.firebaseapp.com',
//     projectId: 'house-marketplace-app-fe',
//     storageBucket: 'house-marketplace-app-fe.appspot.com',
//     messagingSenderId: '259009769416',
//     appId: '1:259009769416:web:133b64134ae0c4766f9afd',
// }

// // Initialize Firebase
// initializeApp(firebaseConfig)
// export const db = getFirestore()

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
