import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Type, AlignLeft } from 'lucide-react';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import type { Category, ProductFormApi } from './types';

interface Props {
  form: ProductFormApi;
  categories: Category[];
  useRichEditor: boolean;
  setUseRichEditor: (value: boolean) => void;
}

export function BasicInfoSection({ form, categories, useRichEditor, setUseRichEditor }: Props) {
  return <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input id="name" {...form.register('name')} placeholder="Ex: Pizza Margherita" />
                  {form.formState.errors.name && <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Preço *</Label>
                  <CurrencyInput
                    id="price"
                    value={form.watch('price') || 0}
                    onChange={(value) => form.setValue('price', value, { shouldValidate: true })}
                  />
                  {form.formState.errors.price && <p className="text-sm text-destructive">
                      {form.formState.errors.price.message}
                    </p>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Descrição</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setUseRichEditor(!useRichEditor)}
                  >
                    {useRichEditor ? (
                      <>
                        <AlignLeft className="w-3 h-3" />
                        Editor Simples
                      </>
                    ) : (
                      <>
                        <Type className="w-3 h-3" />
                        Editor com Formatação
                      </>
                    )}
                  </Button>
                </div>
                {useRichEditor ? (
                  <RichTextEditor
                    value={form.watch('description') || ''}
                    onChange={(value) => form.setValue('description', value)}
                    placeholder="Descreva seu produto..."
                  />
                ) : (
                  <Textarea id="description" {...form.register('description')} placeholder="Descreva seu produto..." rows={3} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select value={form.watch('category_id')} onValueChange={value => form.setValue('category_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
                {form.formState.errors.category_id && <p className="text-sm text-destructive">
                    {form.formState.errors.category_id.message}
                  </p>}
              </div>
            </div>;
}
