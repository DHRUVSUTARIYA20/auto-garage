import { createContext, useContext } from "react";

export type UserRole = "admin" | "customer" | "staff" | "manager" | "mechanic" | "user";
export type User = { 
  id: string; 
  name?: string; 
  email: string; 
  role?: UserRole;
  mobileNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  bio?: string;
  photoUrl?: string;
} | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  login: (email?: string, password?: string, mobileNumber?: string, rememberMe?: boolean) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => null,
  register: async () => { },
  logout: async () => { },
  refreshUser: async () => { },
});

export const useAuth = () => useContext(AuthContext);
