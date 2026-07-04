const admin = require("firebase-admin");
const path = require("path");

// TODO: Replace this with your actual service account key JSON file
// Go to Firebase Console -> Project Settings -> Service Accounts -> Generate new private key
// Save the file as 'firebaseServiceAccount.json' in this 'config' directory.
let serviceAccount;
try {
  serviceAccount = require("./firebaseServiceAccount.json");
} catch (error) {
  console.warn("⚠️ Warning: firebaseServiceAccount.json not found. Firebase Admin is not initialized.");
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin Initialized successfully.");
}

module.exports = admin;
