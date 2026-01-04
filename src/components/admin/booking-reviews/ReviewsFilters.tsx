import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReviewFilters } from "@/hooks/useBookingReviews";

interface ProfessionalOption {
  id: string;
  name: string;
}

interface ReviewsFiltersProps {
  filters: ReviewFilters;
  onFiltersChange: (filters: ReviewFilters) => void;
  professionals: ProfessionalOption[];
  isLoading: boolean;
}

export function ReviewsFilters({ 
  filters, 
  onFiltersChange, 
  professionals,
  isLoading 
}: ReviewsFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Filtro por Profissional */}
      <div className="w-full sm:w-[200px]">
        <Select
          value={filters.professionalId || "all"}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              professionalId: value === "all" ? undefined : value 
            })
          }
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Profissional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os profissionais</SelectItem>
            {professionals.map((prof) => (
              <SelectItem key={prof.id} value={prof.id}>
                {prof.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filtro por Nota Mínima */}
      <div className="w-full sm:w-[180px]">
        <Select
          value={filters.minRating?.toString() || "all"}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              minRating: value === "all" ? undefined : parseInt(value) 
            })
          }
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Nota mínima" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as notas</SelectItem>
            <SelectItem value="5">5 estrelas</SelectItem>
            <SelectItem value="4">4+ estrelas</SelectItem>
            <SelectItem value="3">3+ estrelas</SelectItem>
            <SelectItem value="2">2+ estrelas</SelectItem>
            <SelectItem value="1">1+ estrela</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
