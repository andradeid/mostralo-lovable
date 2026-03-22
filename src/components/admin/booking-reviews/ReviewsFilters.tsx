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
    <div className="flex flex-wrap gap-3">
      {/* Profissional */}
      <Select
        value={filters.professionalId || "all"}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, professionalId: value === "all" ? undefined : value })
        }
        disabled={isLoading}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Profissional" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os profissionais</SelectItem>
          {professionals.map((prof) => (
            <SelectItem key={prof.id} value={prof.id}>{prof.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Nota */}
      <Select
        value={filters.minRating?.toString() || "all"}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, minRating: value === "all" ? undefined : parseInt(value) })
        }
        disabled={isLoading}
      >
        <SelectTrigger className="w-[160px]">
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

      {/* Visibilidade */}
      <Select
        value={filters.visibility || "all"}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, visibility: value === "all" ? undefined : value as "public" | "private" })
        }
        disabled={isLoading}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Visibilidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="public">Públicas</SelectItem>
          <SelectItem value="private">Privadas</SelectItem>
        </SelectContent>
      </Select>

      {/* Com/sem comentário */}
      <Select
        value={filters.hasFeedback || "all"}
        onValueChange={(value) => 
          onFiltersChange({ ...filters, hasFeedback: value === "all" ? undefined : value as "yes" | "no" })
        }
        disabled={isLoading}
      >
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="Comentário" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="yes">Com comentário</SelectItem>
          <SelectItem value="no">Sem comentário</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
