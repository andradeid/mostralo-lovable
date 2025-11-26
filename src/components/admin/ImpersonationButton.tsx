import { Button } from "@/components/ui/button";
import { useImpersonation } from "@/hooks/useImpersonation";
import { UserCheck } from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name?: string;
  user_type: string;
  roles?: any[];
  avatar_url?: string;
}

interface ImpersonationButtonProps {
  user: User;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function ImpersonationButton({ user, size = "sm", variant = "outline" }: ImpersonationButtonProps) {
  const { impersonate } = useImpersonation();

  return (
    <Button
      size={size}
      variant={variant}
      onClick={() => impersonate(user as any)}
    >
      <UserCheck className="w-4 h-4 mr-1" />
      Impersonar
    </Button>
  );
}