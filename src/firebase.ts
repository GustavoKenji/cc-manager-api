import * as admin from 'firebase-admin';

// Em Cloud Run, as credenciais são detectadas automaticamente via
// Application Default Credentials — não precisa de arquivo de chave.
// Localmente, defina GOOGLE_APPLICATION_CREDENTIALS apontando para
// um arquivo de service account baixado do console do Firebase.
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const auth = admin.auth();
export const db = admin.firestore();
export { admin };
