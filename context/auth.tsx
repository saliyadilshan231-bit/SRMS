import { account, databases } from '@/lib/appwrite';
import { ID, type Models } from 'appwrite';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '69aa65950030a8c889da';
const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID || 'user'; // Single collection for all users based on DB schema
const EMAIL_VERIFICATION_URLS = [
  process.env.EXPO_PUBLIC_APPWRITE_EMAIL_VERIFICATION_URL,
  'srms://verify-email',
  'https://verify-email',
].filter((value): value is string => Boolean(value && value.trim()));

type StudentData = {
  name: string;
  email: string;
  dateOfBirth: string;
  gender: string;
};

type AdminData = {
  name: string;
  email: string;
  gender: string;
  role: string;
};

type AuthContextType = {
  user: Models.User<Models.Preferences> | null;
  role: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  resendVerification: (email: string, password: string) => Promise<void>;
  register: (data: StudentData & { password: string }) => Promise<{ verificationEmailSent: boolean }>;
  adminRegister: (data: AdminData & { password: string }) => Promise<{ verificationEmailSent: boolean }>;
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
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const currentUser = await account.get();

      if (!currentUser.emailVerification) {
        try {
          await account.deleteSession('current');
        } catch {
          // Ignore if the session is already missing.
        }
        setUser(null);
        setRole(null);
        return;
      }

      setUser(currentUser);
      
      // Fetch user role from DB
      try {
        const profile = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, currentUser.$id);
        setRole(profile.role || 'Student');
      } catch (profileError) {
         // Default fallback or handle error
         setRole('Student'); 
      }
    } catch {
      setUser(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    let existingUser: Models.User<Models.Preferences> | null = null;

    try {
      existingUser = await account.get();
    } catch {
      // No active session; continue with email/password login.
    }

    if (existingUser) {
      if (!existingUser.emailVerification) {
        await account.deleteSession('current');
        throw new Error('Please verify your email address before login.');
      }
      setUser(existingUser);
      // Fetch role
      try {
        const profile = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, existingUser.$id);
        setRole(profile.role || 'Student');
      } catch (profileError) {
         setRole('Student');
      }
      return;
    }

    try {
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();

      if (!currentUser.emailVerification) {
        await account.deleteSession('current');
        throw new Error('Please verify your email address before login.');
      }

      setUser(currentUser);
      // Fetch user role from DB
      try {
        const profile = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, currentUser.$id);
        setRole(profile.role || 'Student');
      } catch (profileError) {
         setRole('Student');
      }
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to log in. Please check your credentials.'));
    }
  }

  async function register(data: StudentData & { password: string }) {
    const { name, email, password, dateOfBirth, gender } = data;
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000); // To ensure required size 64 fits well

    try {
      await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();
      const verificationEmailSent = await sendVerificationEmail();

      // Profile document mapped to database schema
      try {
        await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, currentUser.$id, {
          username,  // Required
          name,
          email,
          gender,
          role: 'Student', // Regular user
        });
      } catch (profileError) {
        console.warn('Profile document creation failed:', profileError);
      }

      await account.deleteSession('current');
      setUser(null);
      setRole(null);
      return { verificationEmailSent };
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to register right now. Please try again.'));
    }
  }

  async function adminRegister(data: AdminData & { password: string }) {
    const { name, email, password, gender, role } = data;
    const username = email.split('@')[0] + Math.floor(Math.random() * 1000); 

    try {
      await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);
      const currentUser = await account.get();
      const verificationEmailSent = await sendVerificationEmail();

      // Store in mapped database collection with chosen Role
      try {
        await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, currentUser.$id, {
          username,  // Required
          name,
          email,
          gender,
          role, // e.g. "Admin" or "Counciler"
        });
      } catch (profileError) {
        console.warn('Admin profile document creation failed:', profileError);
      }

      await account.deleteSession('current');
      setUser(null);
      setRole(null);
      return { verificationEmailSent };
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to register admin right now. Please try again.'));
    }
  }

  async function resendVerification(email: string, password: string) {
    let sessionCreated = false;

    try {
      await account.createEmailPasswordSession(email, password);
      sessionCreated = true;

      const currentUser = await account.get();
      if (currentUser.emailVerification) {
        throw new Error('Your email is already verified. Please log in.');
      }

      const verificationEmailSent = await sendVerificationEmail();
      if (!verificationEmailSent) {
        throw new Error(
          'Unable to send verification email. Please configure an allowed verification URL in Appwrite.'
        );
      }
    } catch (error) {
      throw new Error(
        getErrorMessage(error, 'Unable to resend verification email. Please check your credentials.')
      );
    } finally {
      if (sessionCreated) {
        try {
          await account.deleteSession('current');
        } catch {
          // Ignore if the temporary session cannot be cleared.
        }
      }
    }
  }

  async function sendVerificationEmail() {
    for (const url of EMAIL_VERIFICATION_URLS) {
      try {
        await account.createVerification(url);
        return true;
      } catch {
        // Try the next configured URL.
      }
    }

    console.warn('Verification email could not be sent for any configured URL.', EMAIL_VERIFICATION_URLS);
    return false;
  }

  async function logout() {
    try {
      await account.deleteSession('current');
    } catch {
      // Ignore if there is no active session.
    }
    setUser(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ user, role, isLoading, login, resendVerification, register, adminRegister, logout }}>
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