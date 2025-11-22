import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
function initFirebaseAdmin() {
  const apps = getApps();

  if (!apps.length) {
    // Validate required environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // More thorough validation
    if (!projectId || typeof projectId !== "string" || projectId.trim() === "") {
      throw new Error(
        "FIREBASE_PROJECT_ID is missing or invalid. " +
        "Please ensure it is set as a non-empty string in your environment variables."
      );
    }

    if (!clientEmail || typeof clientEmail !== "string" || clientEmail.trim() === "") {
      throw new Error(
        "FIREBASE_CLIENT_EMAIL is missing or invalid. " +
        "Please ensure it is set as a non-empty string in your environment variables."
      );
    }

    // Remove surrounding quotes from client email if present
    let processedClientEmail = clientEmail.trim();
    if ((processedClientEmail.startsWith('"') && processedClientEmail.endsWith('"')) ||
        (processedClientEmail.startsWith("'") && processedClientEmail.endsWith("'"))) {
      processedClientEmail = processedClientEmail.slice(1, -1);
    }

    if (!privateKey || typeof privateKey !== "string" || privateKey.trim() === "") {
      throw new Error(
        "FIREBASE_PRIVATE_KEY is missing or invalid. " +
        "Please ensure it is set as a non-empty string in your environment variables. " +
        "If you copied it from Firebase console, make sure to include the full key including BEGIN and END lines."
      );
    }

    // Process the private key - handle both escaped and unescaped newlines
    let processedPrivateKey = privateKey.trim();
    // Remove surrounding quotes if present (common when copying from .env files)
    if ((processedPrivateKey.startsWith('"') && processedPrivateKey.endsWith('"')) ||
        (processedPrivateKey.startsWith("'") && processedPrivateKey.endsWith("'"))) {
      processedPrivateKey = processedPrivateKey.slice(1, -1);
    }
    // Replace escaped newlines (\\n) with actual newlines
    processedPrivateKey = processedPrivateKey.replace(/\\n/g, "\n");
    // If the key doesn't contain actual newlines and doesn't start with -----BEGIN, 
    // it might be base64 encoded or need different handling
    if (!processedPrivateKey.includes("\n") && !processedPrivateKey.includes("-----BEGIN")) {
      // Try to decode if it looks like base64 (optional - Firebase keys are usually PEM format)
      // For now, just use as-is since Firebase expects PEM format
    }

    initializeApp({
      credential: cert({
        projectId: projectId.trim(),
        clientEmail: processedClientEmail,
        privateKey: processedPrivateKey,
      }),
    });
  }

  return {
    auth: getAuth(),
    db: getFirestore(),
  };
}

// Lazy initialization - only initialize when actually used
let adminInstance: ReturnType<typeof initFirebaseAdmin> | null = null;

function getAdminInstance() {
  if (!adminInstance) {
    adminInstance = initFirebaseAdmin();
  }
  return adminInstance;
}

// Create proxy objects that lazily initialize on property access
export const auth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_, prop) {
    const instance = getAdminInstance().auth;
    const value = instance[prop as keyof typeof instance];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export const db = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_, prop) {
    const instance = getAdminInstance().db;
    const value = instance[prop as keyof typeof instance];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
