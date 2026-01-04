import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  Copy, 
  ExternalLink,
  Eye,
  EyeOff,
  CreditCard,
  Users,
  Loader2
} from 'lucide-react';
import { useStoreDigitalCards, type Professional } from '@/hooks/useStoreDigitalCards';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { ShareCardButton } from '@/components/digital-card/ShareCardButton';

export default function StoreDigitalCardsPage() {
  const { 
    cards, 
    storeData, 
    loading, 
    canCreateMore, 
    maxCards,
    getAvailableProfessionals,
    createCard,
    deleteCard,
    toggleActive 
  } = useStoreDigitalCards();

  const [showSelectProfessional, setShowSelectProfessional] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const availableProfessionals = getAvailableProfessionals();

  const handleSelectProfessional = async (professional: Professional) => {
    setCreating(true);
    const success = await createCard(professional.id, {});
    setCreating(false);
    
    if (success) {
      setShowSelectProfessional(false);
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/c/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  const handleDeleteConfirm = async () => {
    if (cardToDelete) {
      await deleteCard(cardToDelete);
      setCardToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-primary" />
            Cartões Digitais da Equipe
          </h1>
          <p className="text-muted-foreground">
            Crie cartões digitais para seus profissionais ({cards.length}/{maxCards})
          </p>
        </div>
        <Button 
          onClick={() => setShowSelectProfessional(true)}
          disabled={!canCreateMore || availableProfessionals.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Cartão
        </Button>
      </div>

      {/* Lista de Cartões */}
      {cards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cartão criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie cartões digitais para seus profissionais compartilharem com clientes.
            </p>
            <Button 
              onClick={() => setShowSelectProfessional(true)}
              disabled={availableProfessionals.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Cartão
            </Button>
            {availableProfessionals.length === 0 && (
              <p className="text-sm text-muted-foreground mt-4">
                Cadastre profissionais no módulo de Agendamento primeiro.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map(card => (
            <Card key={card.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={card.photo_url || card.professional?.photo_url || undefined} />
                      <AvatarFallback>
                        {card.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{card.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {card.title || card.professional?.specialty || 'Profissional'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShareCardButton
                      cardUrl={`${window.location.origin}/c/${card.slug}`}
                      cardName={card.name}
                      variant="admin"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/dashboard/cartoes-equipe/${card.id}`}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyLink(card.slug)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Link
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={`/c/${card.slug}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ver Público
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toggleActive(card.id)}>
                        {card.is_active ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setCardToDelete(card.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={card.is_active ? 'default' : 'secondary'}>
                      {card.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    {card.booking_enabled && (
                      <Badge variant="outline" className="text-xs">
                        Agendamento
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {card.views_count || 0} visualizações
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    /c/{card.slug}
                  </code>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Card para adicionar novo */}
          {canCreateMore && availableProfessionals.length > 0 && (
            <Card 
              className="border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setShowSelectProfessional(true)}
            >
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[180px] py-6">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium">Novo Cartão</p>
                <p className="text-sm text-muted-foreground">
                  {cards.length}/{maxCards} utilizados
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dialog para selecionar profissional */}
      <Dialog open={showSelectProfessional} onOpenChange={setShowSelectProfessional}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Selecione um Profissional
            </DialogTitle>
            <DialogDescription>
              Escolha o profissional para criar o cartão digital.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {availableProfessionals.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Todos os profissionais já possuem cartões</p>
                <p className="text-sm">ou não há profissionais cadastrados.</p>
              </div>
            ) : (
              availableProfessionals.map(professional => (
                <button
                  key={professional.id}
                  onClick={() => handleSelectProfessional(professional)}
                  disabled={creating}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={professional.photo_url || undefined} />
                    <AvatarFallback>
                      {professional.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-1">
                    <p className="font-medium">{professional.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.specialty || 'Profissional'}
                    </p>
                  </div>
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Alert de confirmação de exclusão */}
      <AlertDialog open={!!cardToDelete} onOpenChange={() => setCardToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cartão?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cartão será removido permanentemente
              e o link público deixará de funcionar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
