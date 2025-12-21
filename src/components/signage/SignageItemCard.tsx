import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { GripVertical, Trash2, Play, Image as ImageIcon, Clock, Pencil, Check, X } from 'lucide-react';
import { SignageItem } from '@/hooks/useSignage';

interface SignageItemCardProps {
  item: SignageItem;
  onUpdate: (id: string, updates: Partial<SignageItem>) => Promise<boolean>;
  onDelete: (id: string, fileUrl: string) => Promise<boolean>;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function SignageItemCard({ item, onUpdate, onDelete, dragHandleProps }: SignageItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDuration, setEditDuration] = useState(item.duration_seconds);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    const success = await onUpdate(item.id, {
      title: editTitle,
      duration_seconds: editDuration
    });
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditTitle(item.title);
    setEditDuration(item.duration_seconds);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(item.id, item.file_url);
    setIsDeleting(false);
  };

  const handleToggleActive = async () => {
    await onUpdate(item.id, { is_active: !item.is_active });
  };

  return (
    <Card className={`${!item.is_active ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="cursor-grab hover:bg-muted p-1 rounded"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Preview Thumbnail */}
          <div className="relative w-24 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
            {item.file_type === 'video' ? (
              <>
                <video
                  src={item.file_url}
                  className="w-full h-full object-cover"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Play className="h-6 w-6 text-white" />
                </div>
              </>
            ) : (
              <img
                src={item.file_url}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute top-1 left-1">
              {item.file_type === 'video' ? (
                <Play className="h-3 w-3 text-white drop-shadow" />
              ) : (
                <ImageIcon className="h-3 w-3 text-white drop-shadow" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Título"
                  className="h-8"
                />
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={editDuration}
                    onChange={(e) => setEditDuration(Number(e.target.value))}
                    className="h-8 w-20"
                    min={1}
                    max={300}
                  />
                  <span className="text-sm text-muted-foreground">segundos</span>
                </div>
              </div>
            ) : (
              <div>
                <p className="font-medium truncate">{item.title}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.duration_seconds}s
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Button size="sm" variant="ghost" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Check className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={handleToggleActive}
                  />
                  <Label className="text-sm">Ativo</Label>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
