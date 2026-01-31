import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Search,
  Loader2,
  BookOpen,
  DollarSign,
  Headphones,
  Users,
  Tag,
  X,
  RefreshCw,
} from 'lucide-react';
import { useMasterFaq, MasterFaqItem, CreateFaqInput, UpdateFaqInput } from '@/hooks/useMasterFaq';
import { FaqItemCard } from './FaqItemCard';
import { FaqEditModal } from './FaqEditModal';
import { toast } from 'sonner';

export function MasterFaqTab() {
  const {
    faqs,
    keywords,
    loading,
    saving,
    createFaq,
    updateFaq,
    deleteFaq,
    toggleFaqActive,
    addKeyword,
    deleteKeyword,
    getCounts,
    refetch,
  } = useMasterFaq();

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'sales' | 'support' | 'recruitment'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFaq, setEditingFaq] = useState<MasterFaqItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingFaqId, setDeletingFaqId] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState('');

  const counts = getCounts();

  // Filter FAQs
  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = categoryFilter === 'all' || faq.category === categoryFilter;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.keywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCreateNew = () => {
    setEditingFaq(null);
    setShowEditModal(true);
  };

  const handleEdit = (faq: MasterFaqItem) => {
    setEditingFaq(faq);
    setShowEditModal(true);
  };

  const handleSave = async (data: CreateFaqInput | UpdateFaqInput): Promise<boolean> => {
    if ('id' in data) {
      return updateFaq(data);
    }
    return createFaq(data);
  };

  const handleDelete = (id: string) => {
    setDeletingFaqId(id);
  };

  const confirmDelete = async () => {
    if (deletingFaqId) {
      await deleteFaq(deletingFaqId);
      setDeletingFaqId(null);
    }
  };

  const handleAddKeyword = async () => {
    const trimmed = newKeyword.trim().toLowerCase();
    if (!trimmed) return;
    
    if (keywords.some(k => k.keyword === trimmed)) {
      toast.error('Keyword já existe');
      return;
    }

    const success = await addKeyword(trimmed);
    if (success) {
      setNewKeyword('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Base de Conhecimento do Bot
          </h2>
          <p className="text-sm text-muted-foreground">
            {counts.total} perguntas cadastradas • {counts.active} ativas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button size="sm" onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Pergunta
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por pergunta, resposta ou keyword..."
          className="pl-10"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
        <TabsList className="w-full flex">
          <TabsTrigger value="all" className="flex-1 gap-1">
            <span className="hidden sm:inline">Todas</span>
            <Badge variant="secondary" className="text-xs">{counts.total}</Badge>
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex-1 gap-1">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Vendas</span>
            <Badge variant="secondary" className="text-xs">{counts.sales}</Badge>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex-1 gap-1">
            <Headphones className="w-4 h-4" />
            <span className="hidden sm:inline">Suporte</span>
            <Badge variant="secondary" className="text-xs">{counts.support}</Badge>
          </TabsTrigger>
          <TabsTrigger value="recruitment" className="flex-1 gap-1">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Recruta</span>
            <Badge variant="secondary" className="text-xs">{counts.recruitment}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={categoryFilter} className="space-y-4 mt-4">
          {/* FAQ Cards */}
          {filteredFaqs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? 'Nenhuma pergunta encontrada para esta busca' 
                    : 'Nenhuma pergunta cadastrada nesta categoria'
                  }
                </p>
                <Button variant="outline" className="mt-4" onClick={handleCreateNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar primeira pergunta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredFaqs.map(faq => (
                <FaqItemCard
                  key={faq.id}
                  faq={faq}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={toggleFaqActive}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recruitment Keywords Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Keywords de Recrutamento (Detecção Oculta)
          </CardTitle>
          <CardDescription>
            Quando o cliente menciona essas palavras, o bot detecta interesse em parceria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Nova keyword..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleAddKeyword()}
            />
            <Button variant="outline" onClick={handleAddKeyword} disabled={saving}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {keywords.map(kw => (
              <Badge 
                key={kw.id} 
                variant={kw.is_active ? "default" : "outline"}
                className="gap-1 pr-1"
              >
                {kw.keyword}
                <button
                  onClick={() => deleteKeyword(kw.id)}
                  className="ml-1 hover:text-destructive rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {keywords.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma keyword cadastrada</p>
            )}
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Link de parceiros:</strong> https://mostralo.com.br/seja-vendedor
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <FaqEditModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        faq={editingFaq}
        onSave={handleSave}
        saving={saving}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingFaqId} onOpenChange={() => setDeletingFaqId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pergunta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A pergunta será removida permanentemente da base de conhecimento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
