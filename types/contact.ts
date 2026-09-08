export interface ContactMessage {
  id: string;
  full_name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
}
