import Constants from 'expo-constants';

/**
 * Appwrite IDs from app.json → expo.extra (fill after creating DB / bucket / collection).
 * Collection "TutorApplications" should define attributes matching submit payload (snake_case).
 */
export type AppwriteExtra = {
  appwriteEndpoint?: string;
  appwriteProjectId?: string;
  appwriteDatabaseId?: string;
  appwriteTutorCollectionId?: string;
  appwriteProofBucketId?: string;
  appwriteSessionPollsCollectionId?: string;
};

export function getAppwriteExtra(): AppwriteExtra {
  const extra = (Constants.expoConfig?.extra ?? {}) as AppwriteExtra;
  return extra;
}

export function isAppwriteConfigured(): boolean {
  const e = getAppwriteExtra();
  return Boolean(
    e.appwriteEndpoint &&
      e.appwriteProjectId &&
      e.appwriteDatabaseId &&
      e.appwriteTutorCollectionId &&
      e.appwriteProofBucketId,
  );
}
