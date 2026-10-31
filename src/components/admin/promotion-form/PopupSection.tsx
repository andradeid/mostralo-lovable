import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { PromotionSectionProps } from './types';

export function PopupSection({ formData, setFormData }: PromotionSectionProps) {
  return (
    <>
    {/* Configurações de Popup */}
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="show_as_popup" className="text-base font-semibold">
              Exibir como Popup Automático
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Mostrar esta promoção automaticamente quando o cliente entrar na loja
            </p>
          </div>
          <Switch
            id="show_as_popup"
            checked={formData.show_as_popup || false}
            onCheckedChange={(checked) => {
              setFormData({ 
                ...formData, 
                show_as_popup: checked,
                ...(checked ? {} : {
                  popup_frequency_type: 'once_session',
                  popup_max_displays: 1
                })
              });
            }}
          />
        </div>

        {formData.show_as_popup && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="popup_frequency_type">
                Frequência de Exibição
              </Label>
              <Select
                value={formData.popup_frequency_type || 'once_session'}
                onValueChange={(value: 'once_browser' | 'once_session' | 'custom_count') => 
                  setFormData({ 
                    ...formData, 
                    popup_frequency_type: value,
                    popup_max_displays: value === 'custom_count' ? formData.popup_max_displays : 1
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once_browser">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Uma vez no navegador</span>
                      <span className="text-xs text-muted-foreground">
                        Aparece apenas 1 vez (salvo permanentemente)
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="once_session">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Uma vez por sessão</span>
                      <span className="text-xs text-muted-foreground">
                        Aparece 1 vez cada vez que o cliente abre o site
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="custom_count">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Personalizado (contador)</span>
                      <span className="text-xs text-muted-foreground">
                        Definir quantas vezes o popup pode aparecer
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.popup_frequency_type === 'custom_count' && (
              <div className="space-y-2">
                <Label htmlFor="popup_max_displays">
                  Número Máximo de Exibições
                </Label>
                <Input
                  id="popup_max_displays"
                  type="number"
                  min="1"
                  max="999"
                  value={formData.popup_max_displays || 1}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    popup_max_displays: Math.max(1, parseInt(e.target.value) || 1)
                  })}
                  placeholder="Ex: 3"
                />
                <p className="text-xs text-muted-foreground">
                  O popup aparecerá no máximo {formData.popup_max_displays} vez(es) para cada cliente
                </p>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">Como funciona:</p>
              {formData.popup_frequency_type === 'once_browser' && (
                <p className="text-xs text-muted-foreground">
                  ✓ O popup aparecerá <strong>apenas 1 vez</strong> no navegador do cliente<br/>
                  ✓ Mesmo que o cliente feche e reabra o navegador, não aparecerá novamente<br/>
                  ✓ Salvo permanentemente no dispositivo (localStorage)
                </p>
              )}
              {formData.popup_frequency_type === 'once_session' && (
                <p className="text-xs text-muted-foreground">
                  ✓ O popup aparecerá <strong>1 vez por sessão</strong><br/>
                  ✓ Se o cliente fechar e reabrir o navegador, aparecerá novamente<br/>
                  ✓ Salvo temporariamente na sessão (sessionStorage)
                </p>
              )}
              {formData.popup_frequency_type === 'custom_count' && (
                <p className="text-xs text-muted-foreground">
                  ✓ O popup aparecerá <strong>até {formData.popup_max_displays} vez(es)</strong><br/>
                  ✓ Após atingir o limite, não aparecerá mais<br/>
                  ✓ Contador salvo permanentemente (localStorage)
                </p>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ⚠️ <strong>Apenas 1 promoção pode ter popup ativo por vez.</strong> 
                Ao ativar esta opção, qualquer outra promoção configurada como popup será automaticamente desativada.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </Card>
    </>
  );
}
