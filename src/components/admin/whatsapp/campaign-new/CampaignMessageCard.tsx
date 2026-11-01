// Mensagem (texto/enquete, template, variáveis, mídia e prévia).
// JSX movido da WhatsAppCampaignNewPage sem mudança.
import { WhatsAppPhonePreview } from "@/components/admin/whatsapp/WhatsAppPhonePreview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Eye,
  MessageCircle,
  Upload,
  X,
  FileText,
  Save,
  Vote,
  Plus,
  Trash2,
} from "lucide-react";
import type { CampaignNewPageCtx } from "@/hooks/whatsappCampaign/useCampaignNewPage";

export function CampaignMessageCard({ ctx }: { ctx: CampaignNewPageCtx }) {
  const { templates, storeName, mediaFile, mediaPreview, uploadingMedia, savingMessage, form, setForm, handleMediaUpload, removeMedia, insertVariable, renderMessagePreview, detectVariables, variableDescriptions, saveMessage, getMediaIcon } = ctx;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Mensagem da Campanha *
          </CardTitle>
          <CardDescription>
            Escreva a mensagem ou use um template como base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seletor de Tipo de Interação */}
          <div className="space-y-2">
            <Label>Tipo de Mensagem</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={form.interaction_type === 'text' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => setForm(prev => ({ ...prev, interaction_type: 'text' }))}
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-xs">Texto</span>
              </Button>
              <Button
                type="button"
                variant={form.interaction_type === 'poll' ? 'default' : 'outline'}
                className="flex flex-col items-center gap-1 h-auto py-3"
                onClick={() => setForm(prev => ({ ...prev, interaction_type: 'poll' }))}
              >
                <Vote className="h-5 w-5" />
                <span className="text-xs">Enquete</span>
              </Button>
            </div>
          </div>

          {/* Campos de Enquete */}
          {form.interaction_type === 'poll' && (
            <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Vote className="h-4 w-4" />
                  Pergunta da Enquete *
                </Label>
                <Input
                  value={form.poll_question}
                  onChange={(e) => setForm(prev => ({ ...prev, poll_question: e.target.value }))}
                  placeholder="Ex: Qual horário você prefere para entregas?"
                  maxLength={256}
                />
                <p className="text-xs text-muted-foreground">{form.poll_question.length}/256 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label>Opções (2 a 12)</Label>
                <div className="space-y-2">
                  {form.poll_options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...form.poll_options];
                          newOptions[index] = e.target.value;
                          setForm(prev => ({ ...prev, poll_options: newOptions }));
                        }}
                        placeholder={`Opção ${index + 1}`}
                        maxLength={100}
                      />
                      {form.poll_options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newOptions = form.poll_options.filter((_, i) => i !== index);
                            setForm(prev => ({ ...prev, poll_options: newOptions }));
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {form.poll_options.length < 12 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm(prev => ({ 
                      ...prev, 
                      poll_options: [...prev.poll_options, ''] 
                    }))}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar opção
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Quantidade de seleções permitidas</Label>
                <Select
                  value={String(form.poll_selectable_count)}
                  onValueChange={(v) => setForm(prev => ({ ...prev, poll_selectable_count: parseInt(v) }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 opção (única escolha)</SelectItem>
                    <SelectItem value="2">Até 2 opções</SelectItem>
                    <SelectItem value="3">Até 3 opções</SelectItem>
                    <SelectItem value="0">Sem limite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}


          {/* Seletor de template como base - só para texto */}
          {form.interaction_type === 'text' && (
            <div className="space-y-2">
              <Label>Usar template como base (opcional)</Label>
              <Select
                value={form.template_id}
                onValueChange={(v) => {
                  setForm(prev => ({ ...prev, template_id: v }));
                  const template = templates.find(t => t.id === v);
                  if (template) {
                    setForm(prev => ({ ...prev, custom_message: template.content }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Textarea para mensagem customizada */}
          <div className="space-y-2">
            <Label>Mensagem *</Label>
            <Textarea
              value={form.custom_message}
              onChange={(e) => setForm(prev => ({ ...prev, custom_message: e.target.value }))}
              placeholder="Digite sua mensagem aqui..."
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          {/* Variáveis disponíveis */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Variáveis disponíveis (clique para inserir):</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(variableDescriptions).map(([variable, desc]) => (
                <Badge 
                  key={variable} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                  onClick={() => insertVariable(variable)}
                  title={desc}
                >
                  {variable}
                </Badge>
              ))}
            </div>
          </div>

          {/* Seção de Mídia Integrada */}
          <div className="space-y-2 pt-2 border-t">
            <Label className="flex items-center gap-2">
              {getMediaIcon()}
              Mídia (opcional)
            </Label>
            {mediaPreview || form.media_url ? (
              <div className="relative">
                {form.media_type === 'image' && (
                  <img 
                    src={mediaPreview || form.media_url} 
                    alt="Preview" 
                    className="w-full max-h-40 object-contain rounded-lg bg-muted"
                  />
                )}
                {form.media_type === 'video' && (
                  <video 
                    src={mediaPreview || form.media_url} 
                    className="w-full max-h-40 rounded-lg bg-muted" 
                    controls 
                  />
                )}
                {form.media_type === 'document' && (
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <FileText className="h-8 w-8 text-primary" />
                    <span className="text-sm truncate">{mediaFile?.name || 'Documento'}</span>
                  </div>
                )}
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="absolute top-2 right-2"
                  onClick={removeMedia}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                {uploadingMedia ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Enviando...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">
                      Arraste ou clique para enviar imagem/vídeo
                    </span>
                  </div>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleMediaUpload(file);
                  }}
                  disabled={uploadingMedia}
                />
              </label>
            )}
          </div>

          {/* Preview da mensagem com mockup de celular */}
          {form.custom_message && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-center gap-2">
                <Eye className="h-4 w-4 text-green-600" />
                <Label className="text-sm font-medium">Preview WhatsApp</Label>
              </div>
              
              {/* Mockup de celular */}
              <WhatsAppPhonePreview
                storeName={storeName || 'Sua Loja'}
                message={renderMessagePreview(form.custom_message)}
                mediaUrl={mediaPreview || form.media_url}
                mediaType={form.media_type as 'image' | 'video' | 'document'}
                showTypingAnimation={true}
                playNotificationSound={true}
                allowThemeToggle={true}
                interactionType={form.interaction_type}
                pollQuestion={form.poll_question}
                pollOptions={form.poll_options.filter(o => o.trim())}
                pollSelectableCount={form.poll_selectable_count}
              />

              {/* Legenda de variáveis usadas */}
              {detectVariables(form.custom_message).length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-medium text-muted-foreground mb-2">Variáveis utilizadas:</p>
                  {detectVariables(form.custom_message).map((variable) => (
                    <div key={variable} className="flex items-center gap-2">
                      <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">
                        {variable}
                      </code>
                      <span className="text-muted-foreground">
                        {variableDescriptions[variable] || 'Variável personalizada'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Botão Salvar Mensagem */}
          <Button 
            onClick={saveMessage} 
            disabled={savingMessage || !form.custom_message.trim()}
            variant="secondary"
            className="w-full"
          >
            {savingMessage ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Mensagem
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
