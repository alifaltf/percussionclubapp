export type UserRole = "member" | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
}
