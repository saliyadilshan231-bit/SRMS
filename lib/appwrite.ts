import { Client, Account, Databases } from 'appwrite';

const client = new Client();

client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1')
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '69aa65950030a8c889da');

export const account = new Account(client);
export const databases = new Databases(client);

export { client };