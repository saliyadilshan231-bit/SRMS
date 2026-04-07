import { account, databases } from '@/lib/appwrite';
import { ID, type Models } from 'appwrite';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '69aa65950030a8c889da';
const STUDENTS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID || 'students';
const GRADES_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_GRADES_COLLECTION_ID || 'grades';

export { DATABASE_ID, GRADES_COLLECTION_ID, STUDENTS_COLLECTION_ID };

type StudentData = {
  name: string;
  email: string;
  dateOfBirth: string;
  gender: string;
};

type AuthContextType = {
  user: Models.User<Models.Preferences> | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: StudentData & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = String((error as { message?: unknown }).message ?? '').trim();
    if (message) return message;
  }
  return fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      const existingUser = await account.get();
      if (existingUser) {
        setUser(existingUser);
        return;
      }
    } catch {
      // No active session; continue with email/password login.
    }

    try {
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to log in. Please check your credentials.'));
    }
  }

  async function register(data: StudentData & { password: string }) {
    const { name, email, password, dateOfBirth, gender } = data;

    try {
      await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();

      // Profile document is optional. Do not block account signup if schema/permission differs.
      try {
        await databases.createDocument(DATABASE_ID, STUDENTS_COLLECTION_ID, ID.unique(), {
          userId: currentUser.$id,
          name,
          email,
          dateOfBirth,
          gender,
        });
      } catch (profileError) {
        console.warn('Profile document creation failed:', profileError);
      }

      setUser(currentUser);
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to register right now. Please try again.'));
    }
  }

  async function logout() {
    try {
      await account.deleteSession('current');
    } catch {
      // Ignore if there is no active session.
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}