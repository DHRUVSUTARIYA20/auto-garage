import type { UserRole } from "@/context/useAuth";

type DefaultRole = "admin" | "manager" | "staff" | "customer";

type DefaultCredential = {
  id: string;
  role: DefaultRole;
  name: string;
  email: string;
  password: string;
};

const DEFAULT_CREDENTIALS: Record<DefaultRole, DefaultCredential> = {
  admin: {
    id: "demo-admin",
    role: "admin",
    name: "Demo Admin",
    email: "admin@autogarage.local",
    password: "Admin@123",
  },
  manager: {
    id: "demo-manager",
    role: "manager",
    name: "Demo Manager",
    email: "manager@autogarage.local",
    password: "Manager@123",
  },
  staff: {
    id: "demo-staff",
    role: "staff",
    name: "Demo Staff",
    email: "staff@autogarage.local",
    password: "Staff@123",
  },
  customer: {
    id: "demo-customer",
    role: "customer",
    name: "Demo Customer",
    email: "customer@autogarage.local",
    password: "Customer@123",
  },
};

export const roleDefaultCredentials = DEFAULT_CREDENTIALS;

export const getRoleDefaultCredentials = (role: DefaultRole) => DEFAULT_CREDENTIALS[role];

export const getDefaultUserForCredentials = (email: string, password: string) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");

  const matched = Object.values(DEFAULT_CREDENTIALS).find(
    (credential) =>
      credential.email.toLowerCase() === normalizedEmail &&
      credential.password === normalizedPassword
  );

  if (!matched) return null;

  return {
    id: matched.id,
    email: matched.email,
    name: matched.name,
    role: matched.role as UserRole,
  };
};
