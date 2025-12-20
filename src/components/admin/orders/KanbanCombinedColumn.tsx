import { ReactNode } from "react";
import { Droppable } from "react-beautiful-dnd";
import { LucideIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SectionProps {
  id: string;
  title: string;
  icon: LucideIcon;
  count: number;
  color: string;
  children: ReactNode;
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
  onLoadMore,
  hasMore = false,
  isLoadingMore = false
}: SectionProps) => {
  return (
    <div className="flex-1 flex flex-col min-h-0">
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

      {/* Drop Area with Internal Scroll */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto p-3 bg-muted/20 rounded-b-lg space-y-3 ${
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
    </div>
  );
};

export const KanbanCombinedColumn = ({ sections }: KanbanCombinedColumnProps) => {
  return (
    <div className="flex-1 min-w-[220px] sm:min-w-[260px] lg:min-w-[280px] flex flex-col h-full gap-4">
      {sections.map((section) => (
        <KanbanSection key={section.id} {...section} />
      ))}
    </div>
  );
};
