import { ReactNode, useState } from "react";
import { Droppable } from "react-beautiful-dnd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LucideIcon, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface KanbanColumnProps {
  id: string;
  title: string;
  icon: LucideIcon;
  count: number;
  children: ReactNode;
  color?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export const KanbanColumn = ({ 
  id, 
  title, 
  icon: Icon, 
  count, 
  children, 
  color = "bg-primary",
  collapsible = false,
  defaultCollapsed = false,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false
}: KanbanColumnProps) => {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);

  if (!collapsible) {
    return (
      <div className="flex-1 min-w-[280px] flex-shrink-0 flex flex-col bg-muted/30 rounded-lg">
        {/* Header */}
        <div className={`p-4 ${color} text-primary-foreground rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              <h3 className="font-semibold">{title}</h3>
            </div>
            <div className="bg-background/20 px-3 py-1 rounded-full">
              <span className="font-bold">{count}</span>
            </div>
          </div>
        </div>

        {/* Drop Area */}
        <Droppable droppableId={id}>
          {(provided, snapshot) => (
            <ScrollArea className="flex-1 p-4">
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-3 min-h-[200px] ${
                  snapshot.isDraggingOver ? 'bg-accent/50 rounded-lg' : ''
                }`}
              >
                {children}
                {provided.placeholder}
              </div>
            </ScrollArea>
          )}
        </Droppable>
      </div>
    );
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="flex-1 min-w-[280px] flex-shrink-0 flex flex-col bg-muted/30 rounded-lg"
    >
      {/* Header */}
      <CollapsibleTrigger asChild>
        <div className={`p-4 ${color} text-primary-foreground rounded-t-lg cursor-pointer hover:opacity-90 transition-opacity`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              <h3 className="font-semibold">{title}</h3>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
            <div className="bg-background/20 px-3 py-1 rounded-full">
              <span className="font-bold">{count}</span>
            </div>
          </div>
        </div>
      </CollapsibleTrigger>

      {/* Drop Area */}
      <CollapsibleContent>
        <Droppable droppableId={id}>
          {(provided, snapshot) => (
            <ScrollArea className="flex-1 p-4">
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`space-y-3 min-h-[200px] ${
                  snapshot.isDraggingOver ? 'bg-accent/50 rounded-lg' : ''
                }`}
              >
                {children}
                {provided.placeholder}
                
                {/* Botão Carregar Mais */}
                {hasMore && onLoadMore && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onLoadMore}
                      disabled={isLoadingMore}
                      className="w-full"
                    >
                      {isLoadingMore ? (
                        <>Carregando...</>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2" />
                          Carregar Mais 5
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </Droppable>
      </CollapsibleContent>
    </Collapsible>
  );
};
