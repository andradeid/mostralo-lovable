import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings2, Plus, Trash2, Pill, Loader2, PackageSearch, TrendingUp, Search, X } from "lucide-react";
import { useBotConversationalSettings } from "@/hooks/useBotConversationalSettings";
import { CurrencyInput } from "@/components/ui/currency-input";
import { supabase } from "@/integrations/supabase/client";

interface BotConversationalSettingsCardProps {
  storeId: string;
  disabled?: boolean;
}

// Hook de busca de produtos com debounce
function useProductSearch(storeId: string) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (term: string) => {
    if (!term.trim() || term.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, image_url, slug')
        .eq('store_id', storeId)
        .ilike('name', `%${term}%`)
        .eq('is_available', true)
        .limit(10);
      setResults(data || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [storeId]);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 400);
    return () => clearTimeout(timer);
  }, [query, search]);

  return { query, setQuery, results, searching, setResults };
}

// Hook para buscar produto selecionado pelo ID
function useSelectedProduct(productId: string | null) {
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      return;
    }
    supabase
      .from('products')
      .select('id, name, price, image_url, slug')
      .eq('id', productId)
      .single()
      .then(({ data }) => setProduct(data));
  }, [productId]);

  return product;
}

export function BotConversationalSettingsCard({ storeId, disabled }: BotConversationalSettingsCardProps) {
  const { settings, loading, saving, saveSettings } = useBotConversationalSettings(storeId);
  const [newPhrase, setNewPhrase] = useState('');
  const [newUnavailablePhrase, setNewUnavailablePhrase] = useState('');
  const productSearch = useProductSearch(storeId);
  const selectedProduct = useSelectedProduct(settings.upsell_product_id);

  const handleAddPhrase = () => {
    if (!newPhrase.trim()) return;
    saveSettings({ generic_phrases: [...settings.generic_phrases, newPhrase.trim()] });
    setNewPhrase('');
  };

  const handleRemovePhrase = (index: number) => {
    saveSettings({ generic_phrases: settings.generic_phrases.filter((_, i) => i !== index) });
  };

  const handleUpdatePhrase = (index: number, value: string) => {
    const updated = [...settings.generic_phrases];
    updated[index] = value;
    saveSettings({ generic_phrases: updated });
  };

  const handleAddUnavailablePhrase = () => {
    if (!newUnavailablePhrase.trim()) return;
    saveSettings({ unavailable_phrases: [...settings.unavailable_phrases, newUnavailablePhrase.trim()] });
    setNewUnavailablePhrase('');
  };

  const handleRemoveUnavailablePhrase = (index: number) => {
    saveSettings({ unavailable_phrases: settings.unavailable_phrases.filter((_, i) => i !== index) });
  };

  const handleUpdateUnavailablePhrase = (index: number, value: string) => {
    const updated = [...settings.unavailable_phrases];
    updated[index] = value;
    saveSettings({ unavailable_phrases: updated });
  };

  const handleSelectUpsellProduct = (product: any) => {
    saveSettings({
      upsell_product_id: product.id,
      upsell_custom_price: product.price,
    });
    productSearch.setQuery('');
    productSearch.setResults([]);
  };

  const handleRemoveUpsellProduct = () => {
    saveSettings({
      upsell_product_id: null,
      upsell_custom_price: null,
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="!p-3 !pb-2 sm:!p-6 sm:!pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Settings2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 shrink-0" />
          Configurações Conversacional
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Configure o comportamento do atendimento informal
        </p>
      </CardHeader>
      <CardContent className="!p-3 !pt-0 sm:!p-6 sm:!pt-0 space-y-4">
        {/* Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="never-links" className="text-xs sm:text-sm cursor-pointer">
              🚫 Nunca enviar links
            </Label>
            <Switch
              id="never-links"
              checked={settings.never_send_links}
              onCheckedChange={(v) => saveSettings({ never_send_links: v })}
              disabled={disabled || saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="send-photos" className="text-xs sm:text-sm cursor-pointer">
              📸 Enviar fotos dos produtos
            </Label>
            <Switch
              id="send-photos"
              checked={settings.send_product_photos}
              onCheckedChange={(v) => saveSettings({ send_product_photos: v })}
              disabled={disabled || saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="informal-tone" className="text-xs sm:text-sm cursor-pointer">
              😊 Tom informal e acolhedor
            </Label>
            <Switch
              id="informal-tone"
              checked={settings.informal_tone}
              onCheckedChange={(v) => saveSettings({ informal_tone: v })}
              disabled={disabled || saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="recommend-generics" className="text-xs sm:text-sm cursor-pointer">
              💊 Recomendar genéricos
            </Label>
            <Switch
              id="recommend-generics"
              checked={settings.recommend_generics}
              onCheckedChange={(v) => saveSettings({ recommend_generics: v })}
              disabled={disabled || saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="never-unavailable" className="text-xs sm:text-sm cursor-pointer">
              📦 Nunca dizer que não tem em estoque
            </Label>
            <Switch
              id="never-unavailable"
              checked={settings.never_say_unavailable}
              onCheckedChange={(v) => saveSettings({ never_say_unavailable: v })}
              disabled={disabled || saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="upsell-toggle" className="text-xs sm:text-sm cursor-pointer">
              📈 Oferecer produto antes de fechar pedido (Upsell)
            </Label>
            <Switch
              id="upsell-toggle"
              checked={settings.upsell_enabled}
              onCheckedChange={(v) => saveSettings({ upsell_enabled: v })}
              disabled={disabled || saving}
            />
          </div>
        </div>

        {/* Upsell Section */}
        {settings.upsell_enabled && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500 shrink-0" />
              <Label className="text-xs sm:text-sm font-medium">Configuração de Upsell</Label>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Escolha um produto para oferecer ao cliente antes de fechar o pedido
            </p>

            {/* Produto selecionado */}
            {selectedProduct ? (
              <div className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/50">
                {selectedProduct.image_url && (
                  <img
                    src={selectedProduct.image_url}
                    alt={selectedProduct.name}
                    className="h-10 w-10 rounded object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">{selectedProduct.name}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Preço original: R$ {selectedProduct.price?.toFixed(2)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={handleRemoveUpsellProduct}
                  disabled={disabled || saving}
                >
                  <X className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ) : (
              /* Campo de busca */
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto pelo nome..."
                    value={productSearch.query}
                    onChange={(e) => productSearch.setQuery(e.target.value)}
                    className="pl-8 h-8 text-xs sm:text-sm"
                    disabled={disabled || saving}
                  />
                  {productSearch.searching && (
                    <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Resultados da busca */}
                {productSearch.results.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
                    {productSearch.results.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        className="flex items-center gap-2.5 w-full p-2 hover:bg-accent text-left transition-colors"
                        onClick={() => handleSelectUpsellProduct(product)}
                      >
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-8 w-8 rounded object-cover shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{product.name}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            R$ {product.price?.toFixed(2)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {productSearch.query.length >= 2 && !productSearch.searching && productSearch.results.length === 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg p-3">
                    <p className="text-xs text-muted-foreground text-center">Nenhum produto encontrado</p>
                  </div>
                )}
              </div>
            )}

            {/* Preço promocional */}
            {settings.upsell_product_id && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Preço promocional (opcional)</Label>
                  <CurrencyInput
                    value={settings.upsell_custom_price ?? 0}
                    onChange={(v) => saveSettings({ upsell_custom_price: v || null })}
                    disabled={disabled || saving}
                    className="h-8 text-xs sm:text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Deixe 0 para usar o preço original do produto
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm">Mensagem de oferta</Label>
                  <Textarea
                    value={settings.upsell_message}
                    onChange={(e) => saveSettings({ upsell_message: e.target.value })}
                    placeholder="Ex: Estamos com uma promoção na vitamina C, está saindo por R$XX! Quer aproveitar?"
                    className="text-xs sm:text-sm min-h-[60px]"
                    disabled={disabled || saving}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Mensagem de fechamento */}
        <div className="space-y-1.5">
          <Label className="text-xs sm:text-sm font-medium">Mensagem de fechamento do pedido</Label>
          <Textarea
            value={settings.closing_message}
            onChange={(e) => saveSettings({ closing_message: e.target.value })}
            placeholder="Ex: Obrigada! Seu pedido será preparado 🙏"
            className="text-xs sm:text-sm min-h-[60px]"
            disabled={disabled || saving}
          />
        </div>

        {/* Frases de recomendação de genéricos */}
        {settings.recommend_generics && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-green-500 shrink-0" />
              <Label className="text-xs sm:text-sm font-medium">Frases de recomendação de genéricos</Label>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              O bot usará aleatoriamente uma dessas frases ao sugerir medicamentos genéricos
            </p>

            <div className="space-y-2">
              {settings.generic_phrases.map((phrase, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={phrase}
                    onChange={(e) => handleUpdatePhrase(index, e.target.value)}
                    className="flex-1 h-8 text-xs sm:text-sm"
                    disabled={disabled || saving}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleRemovePhrase(index)}
                    disabled={disabled || saving || settings.generic_phrases.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Nova frase de recomendação..."
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                className="flex-1 h-8 text-xs sm:text-sm"
                disabled={disabled || saving}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPhrase()}
              />
              <Button
                size="sm"
                onClick={handleAddPhrase}
                disabled={disabled || !newPhrase.trim() || saving}
                className="h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>
        )}

        {/* Frases de produto indisponível */}
        {settings.never_say_unavailable && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <PackageSearch className="h-4 w-4 text-orange-500 shrink-0" />
              <Label className="text-xs sm:text-sm font-medium">Frases quando produto não encontrado</Label>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              O bot usará aleatoriamente uma dessas frases ao não localizar um produto no estoque
            </p>

            <div className="space-y-2">
              {settings.unavailable_phrases.map((phrase, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={phrase}
                    onChange={(e) => handleUpdateUnavailablePhrase(index, e.target.value)}
                    className="flex-1 h-8 text-xs sm:text-sm"
                    disabled={disabled || saving}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleRemoveUnavailablePhrase(index)}
                    disabled={disabled || saving || settings.unavailable_phrases.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="Nova frase para produto indisponível..."
                value={newUnavailablePhrase}
                onChange={(e) => setNewUnavailablePhrase(e.target.value)}
                className="flex-1 h-8 text-xs sm:text-sm"
                disabled={disabled || saving}
                onKeyDown={(e) => e.key === 'Enter' && handleAddUnavailablePhrase()}
              />
              <Button
                size="sm"
                onClick={handleAddUnavailablePhrase}
                disabled={disabled || !newUnavailablePhrase.trim() || saving}
                className="h-8"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
