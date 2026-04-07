import { Client, Account, Databases } from 'appwrite';

const client = new Client();

client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1')
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '69aa65950030a8c889da');

export const account = new Account(client);
export const databases = new Databases(client);

export const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '69aa65950030a8c889da';
export const TASKS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_TASKS_COLLECTION_ID || 'tasks';
export const SESSIONS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID || 'sessions';
export const NOTIFICATIONS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_NOTIFICATIONS_COLLECTION_ID || 'notifications';

export { client };