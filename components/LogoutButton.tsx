import Button from "@/components/ui/Button";
import { logout } from "@/lib/supabase/actions";

export default function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="outline">
        Log Out
      </Button>
    </form>
  );
}
