import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { GripVertical, Check, X, RotateCcw, SortAsc, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { groupedItemsToPreferences, MenuPreferences } from "@/hooks/useAdminMenuPreferences";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  group: string;
}

interface MenuEditModeProps {
  groupedItems: Record<string, MenuItem[]>;
  onSave: (preferences: MenuPreferences) => Promise<boolean>;
  onCancel: () => void;
  onReset: () => Promise<boolean>;
  saving: boolean;
  currentSortAlphabetically: boolean;
}

export function MenuEditMode({
  groupedItems,
  onSave,
  onCancel,
  onReset,
  saving,
  currentSortAlphabetically
}: MenuEditModeProps) {
  // Estado local para edição
  const [editableGroups, setEditableGroups] = useState<Record<string, MenuItem[]>>(() => {
    // Deep clone para evitar mutação
    const clone: Record<string, MenuItem[]> = {};
    Object.entries(groupedItems).forEach(([key, items]) => {
      clone[key] = items.map(item => ({ ...item }));
    });
    return clone;
  });
  const [sortAlphabetically, setSortAlphabetically] = useState(currentSortAlphabetically);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    Object.keys(groupedItems).forEach(key => {
      initial[key] = true;
    });
    return initial;
  });

  // Aplicar ordenação alfabética quando ativada
  useEffect(() => {
    if (sortAlphabetically) {
      const sorted: Record<string, MenuItem[]> = {};
      Object.keys(editableGroups)
        .sort((a, b) => a.localeCompare(b, 'pt-BR'))
        .forEach(groupName => {
          sorted[groupName] = [...editableGroups[groupName]].sort((a, b) => 
            a.title.localeCompare(b.title, 'pt-BR')
          );
        });
      setEditableGroups(sorted);
    }
  }, [sortAlphabetically]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (sortAlphabetically) return; // Não permitir drag com ordenação alfabética

    const { source, destination, type } = result;

    // Reordenar grupos
    if (type === 'GROUP') {
      const groupNames = Object.keys(editableGroups);
      const [removed] = groupNames.splice(source.index, 1);
      groupNames.splice(destination.index, 0, removed);

      const reordered: Record<string, MenuItem[]> = {};
      groupNames.forEach(name => {
        reordered[name] = editableGroups[name];
      });
      setEditableGroups(reordered);
      return;
    }

    // Reordenar itens dentro de um grupo ou entre grupos
    const sourceGroupId = source.droppableId;
    const destGroupId = destination.droppableId;

    if (sourceGroupId === destGroupId) {
      // Mesmo grupo
      const items = [...editableGroups[sourceGroupId]];
      const [removed] = items.splice(source.index, 1);
      items.splice(destination.index, 0, removed);
      setEditableGroups({
        ...editableGroups,
        [sourceGroupId]: items
      });
    } else {
      // Grupos diferentes
      const sourceItems = [...editableGroups[sourceGroupId]];
      const destItems = [...editableGroups[destGroupId]];
      const [removed] = sourceItems.splice(source.index, 1);
      
      // Atualizar o grupo do item movido
      removed.group = destGroupId;
      destItems.splice(destination.index, 0, removed);

      const newGroups = {
        ...editableGroups,
        [sourceGroupId]: sourceItems,
        [destGroupId]: destItems
      };

      // Remover grupos vazios
      Object.keys(newGroups).forEach(key => {
        if (newGroups[key].length === 0) {
          delete newGroups[key];
        }
      });

      setEditableGroups(newGroups);
    }
  };

  const handleSave = async () => {
    const preferences = groupedItemsToPreferences(editableGroups, sortAlphabetically);
    const success = await onSave(preferences);
    if (success) {
      onCancel();
    }
  };

  const handleReset = async () => {
    const success = await onReset();
    if (success) {
      onCancel();
    }
  };

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header de Edição */}
      <div className="p-3 border-b bg-primary/5 space-y-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 gap-1"
          >
            <Check className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 gap-1"
          >
            <X className="w-4 h-4" />
            Cancelar
          </Button>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReset}
          disabled={saving}
          className="w-full gap-1 text-muted-foreground"
        >
          <RotateCcw className="w-3 h-3" />
          Resetar para Padrão
        </Button>

        {/* Toggle Ordenação Alfabética */}
        <div className="flex items-center justify-between p-2 bg-background rounded-lg">
          <div className="flex items-center gap-2">
            <SortAsc className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="sort-alpha" className="text-sm cursor-pointer">
              Ordem Alfabética
            </Label>
          </div>
          <Switch
            id="sort-alpha"
            checked={sortAlphabetically}
            onCheckedChange={setSortAlphabetically}
          />
        </div>

        {!sortAlphabetically && (
          <p className="text-xs text-muted-foreground text-center">
            Arraste os itens para reorganizar
          </p>
        )}
      </div>

      {/* Lista Editável */}
      <div className="flex-1 overflow-y-auto p-2">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="groups" type="GROUP" mode="standard">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2 min-h-[200px] relative"
              >
                {Object.entries(editableGroups).map(([groupName, items], groupIndex) => (
                  <Draggable 
                    key={groupName} 
                    draggableId={`group-${groupName}`} 
                    index={groupIndex}
                    isDragDisabled={sortAlphabetically}
                  >
                    {(groupProvided, groupSnapshot) => (
                      <div
                        ref={groupProvided.innerRef}
                        {...groupProvided.draggableProps}
                        className={cn(
                          "bg-muted/30 rounded-lg border transition-colors",
                          groupSnapshot.isDragging && "ring-2 ring-primary shadow-lg"
                        )}
                      >
                        <Collapsible 
                          open={openGroups[groupName]} 
                          onOpenChange={() => toggleGroup(groupName)}
                        >
                          <div className="flex items-center p-2 gap-2">
                            {!sortAlphabetically && (
                              <div
                                {...groupProvided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                              >
                                <GripVertical className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <CollapsibleTrigger asChild>
                              <button className="flex-1 flex items-center gap-2 text-left">
                                {openGroups[groupName] ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                                <span className="text-sm font-medium">{groupName}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({items.length})
                                </span>
                              </button>
                            </CollapsibleTrigger>
                          </div>

                          <CollapsibleContent>
                            <Droppable 
                              droppableId={groupName} 
                              type="ITEM"
                              mode="standard"
                            >
                              {(itemProvided, itemSnapshot) => (
                                <div
                                  ref={itemProvided.innerRef}
                                  {...itemProvided.droppableProps}
                                  className={cn(
                                    "px-2 pb-2 space-y-1 min-h-[40px] relative",
                                    itemSnapshot.isDraggingOver && "bg-primary/5 rounded-b-lg"
                                  )}
                                >
                                  {items.map((item, itemIndex) => (
                                    <Draggable
                                      key={item.url}
                                      draggableId={item.url}
                                      index={itemIndex}
                                      isDragDisabled={sortAlphabetically}
                                    >
                                      {(dragProvided, dragSnapshot) => (
                                        <div
                                          ref={dragProvided.innerRef}
                                          {...dragProvided.draggableProps}
                                          className={cn(
                                            "flex items-center gap-2 p-2 bg-background rounded-md border text-sm",
                                            dragSnapshot.isDragging && "ring-2 ring-primary shadow-lg",
                                            sortAlphabetically && "cursor-default"
                                          )}
                                        >
                                          {!sortAlphabetically && (
                                            <div
                                              {...dragProvided.dragHandleProps}
                                              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                                            >
                                              <GripVertical className="w-3 h-3 text-muted-foreground" />
                                            </div>
                                          )}
                                          <item.icon className="w-4 h-4 text-muted-foreground" />
                                          <span className="flex-1 truncate">{item.title}</span>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {itemProvided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
