import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { account, databases } from '@/lib/appwrite';
import { ID, type Models } from 'appwrite';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || '69aa65950030a8c889da';
const STUDENTS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID || 'students';

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
    await account.createEmailPasswordSession(email, password);
    const currentUser = await account.get();
    setUser(currentUser);
  }

  async function register(data: StudentData & { password: string }) {
    const { name, email, password, dateOfBirth, gender } = data;
    await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    const currentUser = await account.get();

    // Save student profile to database
    await databases.createDocument(DATABASE_ID, STUDENTS_COLLECTION_ID, currentUser.$id, {
      name,
      Students: name,
      emailAddress: email,
      dateOfBirth,
      gender,
    });

    setUser(currentUser);
  }

  async function logout() {
    await account.deleteSession('current');
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