import { ReactNode, useState } from "react";
import { Droppable } from "react-beautiful-dnd";
import { LucideIcon, ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface SectionProps {
  id: string;
  title: string;
  icon: LucideIcon;
  count: number;
  color: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

interface KanbanCombinedColumnProps {
  sections: SectionProps[];
}

const KanbanSection = ({ 
  id, 
  title, 
  icon: Icon, 
  count, 
  color, 
  children,
  collapsible = false,
  defaultCollapsed = false,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false
}: SectionProps) => {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed);

  if (!collapsible) {
    return (
      <div className="mb-4">
        {/* Section Header */}
        <div className={`p-3 ${color} text-primary-foreground rounded-t-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <h4 className="font-medium text-sm">{title}</h4>
            </div>
            <div className="bg-background/20 px-2 py-0.5 rounded-full">
              <span className="font-bold text-sm">{count}</span>
            </div>
          </div>
        </div>

        {/* Drop Area */}
        <Droppable droppableId={id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`p-3 bg-muted/20 rounded-b-lg space-y-3 min-h-[120px] ${
                snapshot.isDraggingOver ? 'bg-accent/50' : ''
              }`}
            >
              {children}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4">
      {/* Section Header */}
      <CollapsibleTrigger asChild>
        <div className={`p-3 ${color} text-primary-foreground rounded-t-lg cursor-pointer hover:opacity-90 transition-opacity`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <h4 className="font-medium text-sm">{title}</h4>
              {isOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </div>
            <div className="bg-background/20 px-2 py-0.5 rounded-full">
              <span className="font-bold text-sm">{count}</span>
            </div>
          </div>
        </div>
      </CollapsibleTrigger>

      {/* Drop Area */}
      <CollapsibleContent>
        <Droppable droppableId={id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`p-3 bg-muted/20 rounded-b-lg space-y-3 min-h-[120px] ${
                snapshot.isDraggingOver ? 'bg-accent/50' : ''
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadMore();
                    }}
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
          )}
        </Droppable>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const KanbanCombinedColumn = ({ sections }: KanbanCombinedColumnProps) => {
  const totalCount = sections.reduce((sum, section) => sum + section.count, 0);

  return (
    <div className="flex-1 min-w-[220px] sm:min-w-[260px] lg:min-w-[280px] flex flex-col bg-muted/30 rounded-lg h-full">
      {/* Main Header */}
      <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-primary-foreground rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Entrega/Concluído</span>
          </div>
          <div className="bg-background/20 px-3 py-1 rounded-full">
            <span className="font-bold">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Sections Container with Scroll */}
      <div className="flex-1 overflow-y-auto p-4">
        {sections.map((section) => (
          <KanbanSection key={section.id} {...section} />
        ))}
      </div>
    </div>
  );
};
