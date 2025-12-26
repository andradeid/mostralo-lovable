import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Category {
  id: string;
  name: string;
  display_order: number;
}

interface TableCategoryFilterProps {
  categories: Category[];
  activeCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

export function TableCategoryFilter({ categories, activeCategory, onCategoryChange }: TableCategoryFilterProps) {
  return (
    <ScrollArea className="pb-3">
      <div className="flex gap-2 px-4">
        <Button
          variant={activeCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange(null)}
        >
          Todos
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}
