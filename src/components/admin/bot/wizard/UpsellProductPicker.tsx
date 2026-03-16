import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { UpsellProduct } from "./types";

interface UpsellProductPickerProps {
  storeId: string | null;
  selectedProducts: UpsellProduct[];
  onChange: (products: UpsellProduct[]) => void;
}

export function UpsellProductPicker({ storeId, selectedProducts, onChange }: UpsellProductPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<UpsellProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Busca debounced (400ms)
  const debouncedSearch = useDebouncedCallback(async (term: string) => {
    if (!storeId || term.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, image_url")
        .eq("store_id", storeId)
        .eq("is_available", true)
        .ilike("name", `%${term}%`)
        .order("name")
        .limit(20);

      if (error) throw error;

      // Filtrar produtos já selecionados
      const selectedIds = new Set(selectedProducts.map(p => p.id));
      setResults((data || []).filter(p => !selectedIds.has(p.id)));
    } catch (err) {
      console.error("[UpsellProductPicker] Erro na busca:", err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, 400);

  const handleInputChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (value.length >= 2) {
      setIsSearching(true);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
    debouncedSearch(value);
  }, [debouncedSearch]);

  const addProduct = useCallback((product: UpsellProduct) => {
    onChange([...selectedProducts, product]);
    setSearchTerm("");
    setResults([]);
    setShowResults(false);
  }, [selectedProducts, onChange]);

  const removeProduct = useCallback((productId: string) => {
    onChange(selectedProducts.filter(p => p.id !== productId));
  }, [selectedProducts, onChange]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  return (
    <div className="space-y-2 mt-2" ref={containerRef}>
      {/* Produtos selecionados */}
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedProducts.map(product => (
            <Badge
              key={product.id}
              variant="secondary"
              className="flex items-center gap-1 py-1 px-2 text-xs"
            >
              <Package className="h-3 w-3 shrink-0" />
              <span className="truncate max-w-[150px]">{product.name}</span>
              <span className="text-muted-foreground">{formatPrice(product.price)}</span>
              <button
                type="button"
                onClick={() => removeProduct(product.id)}
                className="ml-0.5 hover:text-destructive transition-colors"
                aria-label={`Remover ${product.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Campo de busca */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Buscar produto para upsell..."
          className="pl-8 h-8 text-sm"
        />
        {isSearching && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Resultados da busca */}
      {showResults && (
        <div className="border rounded-lg max-h-[200px] overflow-y-auto bg-popover shadow-md">
          {results.length === 0 && !isSearching && searchTerm.length >= 2 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum produto encontrado
            </p>
          )}
          {results.map(product => (
            <button
              key={product.id}
              type="button"
              onClick={() => addProduct(product)}
              className="flex items-center gap-2 w-full p-2 text-left hover:bg-accent transition-colors text-sm border-b last:border-b-0"
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-8 w-8 rounded object-cover shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{product.name}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatPrice(product.price)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
