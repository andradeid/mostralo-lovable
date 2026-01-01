import { Building2, Calendar, Eye, Mail, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StaleLeadBadge, getRowClassName } from '@/components/leads/StaleLeadBadge';
import { QualificationBadge } from '@/components/leads/QualificationBadge';
import type { QualificationLevel } from '@/components/leads/QualificationBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company_name: string;
  city: string;
  status: string;
  created_at: string;
  updated_at: string;
  salespeople?: { full_name: string } | null;
  qualification_level?: QualificationLevel;
  qualification_score?: number | null;
}

interface LeadCardProps {
  lead: Lead;
  statusOptions: { value: string; label: string; color: string }[];
  onStatusChange: (leadId: string, newStatus: string) => void;
  onViewDetails: () => void;
}

export function LeadCard({ lead, statusOptions, onStatusChange, onViewDetails }: LeadCardProps) {
  return (
    <div className={`p-3 border rounded-lg ${getRowClassName(lead.updated_at, lead.status)}`}>
      {/* Header: Nome + Status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm truncate">{lead.name}</p>
            <StaleLeadBadge updatedAt={lead.updated_at} status={lead.status} />
            {lead.qualification_level && (
              <QualificationBadge level={lead.qualification_level} />
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{lead.company_name}</span>
          </p>
        </div>
        {/* Status Select compacto */}
        <Select value={lead.status} onValueChange={(v) => onStatusChange(lead.id, v)}>
          <SelectTrigger className="w-[100px] h-7 text-xs shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(s => (
              <SelectItem key={s.value} value={s.value} className="text-xs">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Info: Cidade + Data + Vendedor */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 flex-wrap">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0" />
          {lead.city}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3 shrink-0" />
          {format(new Date(lead.created_at), 'dd/MM/yy', { locale: ptBR })}
        </span>
        {lead.salespeople?.full_name && (
          <span className="truncate">• {lead.salespeople.full_name}</span>
        )}
      </div>

      {/* Contato + Ação */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t">
        <div className="flex items-center gap-2 text-xs min-w-0">
          <a 
            href={`tel:${lead.phone}`} 
            className="flex items-center gap-1 text-primary hover:underline shrink-0"
          >
            <Phone className="w-3 h-3" />
            <span className="hidden xs:inline">{lead.phone}</span>
          </a>
          <a 
            href={`mailto:${lead.email}`} 
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground truncate"
          >
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{lead.email}</span>
          </a>
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={onViewDetails}>
          <Eye className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
