import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, LogOut, Settings, Camera, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

export function UserProfileHeader() {
  const { profile, signOut, isImpersonating, originalAdmin, stopImpersonation, user } = useAuth();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout.",
        variant: "destructive"
      });
    }
  };

  const handleStopImpersonation = () => {
    stopImpersonation();
    toast({
      title: "Impersonação finalizada",
      description: "Você voltou ao seu perfil de administrador."
    });
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Remove avatar anterior se existir
      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload novo avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Atualizar perfil no banco
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: "Sucesso",
        description: "Avatar atualizado com sucesso!"
      });

      // Recarregar a página para atualizar o avatar
      window.location.reload();
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o avatar",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!"
      });

      setShowProfileDialog(false);
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return profile?.email?.charAt(0).toUpperCase() || 'U';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  if (!profile) return null;

  return (
    <div className="flex items-center space-x-3">
      {/* Indicador de impersonação */}
      {isImpersonating && originalAdmin && (
        <div className="flex items-center space-x-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
          <UserCheck className="w-4 h-4" />
          <span>Impersonando: {profile.full_name || profile.email}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleStopImpersonation}
            className="h-6 px-2 text-xs"
          >
            Sair
          </Button>
        </div>
      )}

      {/* Perfil do usuário */}
      <ThemeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-2 h-10 px-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">{profile.full_name || profile.email}</p>
              <p className="text-xs text-muted-foreground">
                {profile.user_type === 'master_admin' ? 'Admin Master' : 'Admin Loja'}
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <User className="mr-2 h-4 w-4" />
                Editar Perfil
              </DropdownMenuItem>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Perfil</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Avatar */}
                <div className="flex flex-col items-center space-y-2">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-lg">
                      {getInitials(profile.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleAvatarUpload(file);
                        };
                        input.click();
                      }}
                      disabled={uploading}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {uploading ? 'Enviando...' : 'Alterar Foto'}
                    </Button>
                  </div>
                </div>

                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome Completo</Label>
                  <Input
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Digite seu nome completo"
                  />
                </div>

                {/* E-mail (readonly) */}
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    value={profile.email}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowProfileDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleUpdateProfile}>
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Sair do Sistema
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}