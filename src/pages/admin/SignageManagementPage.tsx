import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Monitor, 
  Plus, 
  Copy, 
  ExternalLink, 
  Image as ImageIcon, 
  Film, 
  PlayCircle,
  CheckCircle,
  XCircle,
  Info,
  Tv,
  Lightbulb,
  ChevronDown,
  Settings,
  Maximize,
  Wifi,
  Megaphone
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useSignage } from '@/hooks/useSignage';
import { usePasswordCallConfig } from '@/hooks/usePasswordCallConfig';
import { SignageItemCard } from '@/components/signage/SignageItemCard';
import { SignageUploadDialog } from '@/components/signage/SignageUploadDialog';
import { SignageConfigPanel } from '@/components/signage/SignageConfigPanel';
import { SignagePreview } from '@/components/signage/SignagePreview';
import { PasswordCallKeypad } from '@/components/signage/PasswordCallKeypad';
import { PasswordCallConfigPanel } from '@/components/signage/PasswordCallConfigPanel';
import { supabase } from '@/integrations/supabase/client';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

export default function SignageManagementPage() {
  const { storeId } = useStoreAccess();
  const { items, config, loading, addItem, updateItem, deleteItem, reorderItems, updateConfig, uploadFile } = useSignage(storeId);
  const { config: passwordConfig, loading: passwordConfigLoading, saveConfig: savePasswordConfig } = usePasswordCallConfig(storeId);
  const { toast } = useToast();

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);

  // Buscar slug da loja
  useState(() => {
    if (storeId) {
      supabase
        .from('stores')
        .select('slug')
        .eq('id', storeId)
        .single()
        .then(({ data }) => {
          if (data) setStoreSlug(data.slug);
        });
    }
  });

  const publicUrl = storeSlug ? `${window.location.origin}/painel/${storeSlug}` : '';

  const handleCopyLink = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      toast({ title: 'Link copiado!' });
    }
  };

  const handleUpload = useCallback(async (files: { file: File; title: string; duration: number; type: 'image' | 'video' }[]) => {
    if (!storeId) return;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const fileUrl = await uploadFile(f.file);
      if (fileUrl) {
        await addItem({
          store_id: storeId,
          title: f.title,
          file_url: fileUrl,
          file_type: f.type,
          duration_seconds: f.duration,
          sort_order: items.length + i,
          is_active: true
        });
      }
    }
  }, [storeId, uploadFile, addItem, items.length]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reordered = Array.from(items);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    reorderItems(reordered);
  };

  // Stats
  const totalItems = items.length;
  const activeItems = items.filter(i => i.is_active).length;
  const imageCount = items.filter(i => i.file_type === 'image').length;
  const videoCount = items.filter(i => i.file_type === 'video').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            Painel Digital
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as mídias que serão exibidas no seu painel promocional
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={items.length === 0}>
            <PlayCircle className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Mídia
          </Button>
        </div>
      </div>

      {/* Link do Painel */}
      {storeSlug && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Link do seu Painel Digital</p>
                <div className="flex items-center gap-2">
                  <Input value={publicUrl} readOnly className="bg-muted" />
                  <Button variant="outline" size="icon" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => window.open(publicUrl, '_blank')}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Abra este link na TV/monitor da sua loja</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções de Uso */}
      <Collapsible defaultOpen={items.length === 0}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tv className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Como usar o Painel Digital</CardTitle>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Passo a passo */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-sm">Copie o link do painel</p>
                    <p className="text-sm text-muted-foreground">Use o botão de copiar acima para copiar o link público do seu painel.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-sm">Abra no navegador da TV/Totem</p>
                    <p className="text-sm text-muted-foreground">Cole o link no navegador (Chrome, Edge, etc.) do dispositivo onde deseja exibir as mídias.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                    3
                  </div>
                  <div className="flex items-center gap-2">
                    <Maximize className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Ative a tela cheia</p>
                      <p className="text-sm text-muted-foreground">Pressione F11 ou clique no ícone de tela cheia no painel para maximizar a exibição.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dicas */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-sm">Dicas importantes</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-start gap-2 p-2 rounded-lg border bg-background">
                    <Settings className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Use o <strong>modo quiosque</strong> do navegador para evitar interrupções.</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg border bg-background">
                    <Tv className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Configure a <strong>orientação</strong> (horizontal/vertical) nas configurações.</span>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded-lg border bg-background">
                    <Wifi className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">Mantenha <strong>internet conectada</strong> para atualizações automáticas.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Mídias</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <Monitor className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mídias Ativas</p>
                <p className="text-2xl font-bold">{activeItems}</p>
              </div>
              {activeItems > 0 ? (
                <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive opacity-50" />
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Imagens</p>
                <p className="text-2xl font-bold">{imageCount}</p>
              </div>
              <ImageIcon className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vídeos</p>
                <p className="text-2xl font-bold">{videoCount}</p>
              </div>
              <Film className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Mídias */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mídias do Painel</h2>
            <Badge variant="secondary">{items.length} item(ns)</Badge>
          </div>

          {items.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Nenhuma mídia adicionada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Adicione imagens ou vídeos para começar a usar seu painel digital
                </p>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Mídia
                </Button>
              </CardContent>
            </Card>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="signage-items">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {items.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <SignageItemCard
                              item={item}
                              onUpdate={updateItem}
                              onDelete={deleteItem}
                              dragHandleProps={provided.dragHandleProps ?? undefined}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {/* Teclado de Chamada de Senha */}
          <PasswordCallKeypad storeId={storeId} config={passwordConfig} />
        </div>

        {/* Configurações */}
        <div className="space-y-4">
          <Tabs defaultValue="panel" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="panel">
                <Monitor className="h-4 w-4 mr-2" />
                Painel
              </TabsTrigger>
              <TabsTrigger value="password">
                <Megaphone className="h-4 w-4 mr-2" />
                Senhas
              </TabsTrigger>
            </TabsList>
            <TabsContent value="panel" className="mt-4">
              <SignageConfigPanel config={config} onSave={updateConfig} />
            </TabsContent>
            <TabsContent value="password" className="mt-4">
              <PasswordCallConfigPanel config={passwordConfig} onSave={savePasswordConfig} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <SignageUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
      />

      <SignagePreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        items={items}
        config={config}
        publicUrl={publicUrl}
      />
    </div>
  );
}
