import { Label } from '@/components/ui/label';

interface Props {
  addonCategories: any[];
  selectedAddonCategories: string[];
  setSelectedAddonCategories: (ids: string[]) => void;
}

/** Só aparece quando a loja tem categorias de adicionais (o ProductForm decide). */
export function AddonsSection({ addonCategories, selectedAddonCategories, setSelectedAddonCategories }: Props) {
  return <div className="space-y-4">
                <h3 className="text-lg font-medium">Adicionais Disponíveis</h3>
                <p className="text-sm text-muted-foreground">
                  Selecione as categorias de adicionais que estarão disponíveis para este produto
                </p>

                <div className="space-y-3">
                  {addonCategories.map((category) => (
                    <div key={category.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <input
                        type="checkbox"
                        id={`addon-category-${category.id}`}
                        checked={selectedAddonCategories.includes(category.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAddonCategories([...selectedAddonCategories, category.id]);
                          } else {
                            setSelectedAddonCategories(selectedAddonCategories.filter(id => id !== category.id));
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor={`addon-category-${category.id}`} className="font-medium cursor-pointer">
                          {category.name}
                        </Label>
                        {category.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {category.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          {category.is_required && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                              Obrigatório
                            </span>
                          )}
                          {category.min_selections > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Mín: {category.min_selections}
                            </span>
                          )}
                          {category.max_selections && (
                            <span className="text-xs text-muted-foreground">
                              Máx: {category.max_selections}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

            {selectedAddonCategories.length > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>{selectedAddonCategories.length} categoria(s) de adicionais selecionada(s)</strong>
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Os clientes poderão escolher adicionais dessas categorias ao comprar este produto.
                    </p>
                  </div>
                )}
              </div>;
}
