import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useBooking } from '@/hooks/useBooking';
import { ModuleGate } from '@/components/admin/ModuleGate';
import { usePageSEO } from '@/hooks/useSEO';
import { useProfessionalTodayStats } from '@/hooks/professionals/useProfessionalTodayStats';
import {
  useProfessionalStoreSlug,
  useProfessionalServicesMap,
  useProfessionalStoreName,
} from '@/hooks/professionals/useProfessionalsPageData';
import { useProfessionalDialogs } from '@/hooks/professionals/useProfessionalDialogs';
import { useProfessionalEditor } from '@/hooks/professionals/useProfessionalEditor';
import {
  filterAndSortProfessionals,
  professionalsKpis,
  type StatusFilter,
  type SortOption,
} from '@/lib/professionals/professionalsList';
import { ProfessionalsHeader } from '@/components/admin/professionals/page/ProfessionalsHeader';
import { ProfessionalsQuickActions } from '@/components/admin/professionals/page/ProfessionalsQuickActions';
import { ProfessionalsHelpCards } from '@/components/admin/professionals/page/ProfessionalsHelpCards';
import { ProfessionalsKpiCards } from '@/components/admin/professionals/page/ProfessionalsKpiCards';
import { ProfessionalsFilters } from '@/components/admin/professionals/page/ProfessionalsFilters';
import { ProfessionalsGrid } from '@/components/admin/professionals/page/ProfessionalsGrid';
import { ProfessionalCreateDialog } from '@/components/admin/professionals/page/ProfessionalCreateDialog';
import { ProfessionalEditDialog } from '@/components/admin/professionals/page/ProfessionalEditDialog';
import { ProfessionalDeleteDialog } from '@/components/admin/professionals/page/ProfessionalDeleteDialog';
import { ProfessionalToolDialogs } from '@/components/admin/professionals/page/ProfessionalToolDialogs';

// Tela de Profissionais do painel de agendamento. Só orquestra: consultas e ações em
// src/hooks/professionals/, blocos visuais em src/components/admin/professionals/page/
// e regras puras em src/lib/professionals/.
const ProfessionalsPage = () => {
  const { profile } = useAuth();
  const { storeId } = useStoreAccess();
  const {
    professionals,
    loadingProfessionals,
    createProfessional,
    updateProfessional,
    deleteProfessional,
    creatingProfessional,
    updatingProfessional,
    deletingProfessional
  } = useBooking(storeId);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('name');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const dialogs = useProfessionalDialogs();
  const editor = useProfessionalEditor({ storeId, dialogs, updateProfessional, deleteProfessional });

  // Fetch today stats
  const professionalIds = useMemo(() => professionals.map(p => p.id), [professionals]);
  const { data: todayStats } = useProfessionalTodayStats(professionalIds, storeId);

  const { storeSlug, copyBookingLink } = useProfessionalStoreSlug(storeId);
  const professionalServices = useProfessionalServicesMap(professionals, storeId);

  usePageSEO({
    title: 'Profissionais - Agendamento',
    description: 'Gerencie os profissionais do seu estabelecimento',
    keywords: 'profissionais, agendamento, barbeiro, serviços'
  });

  const filteredProfessionals = useMemo(
    () => filterAndSortProfessionals(professionals, searchTerm, statusFilter, sortOption, todayStats),
    [professionals, searchTerm, statusFilter, sortOption, todayStats]
  );

  // Calculate KPIs
  const kpis = useMemo(() => professionalsKpis(professionals), [professionals]);

  const storeName = useProfessionalStoreName(storeId);

  return (
    <ModuleGate moduleKey="booking" storeId={storeId}>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <ProfessionalsHeader kpis={kpis} />

        {/* Quick Actions */}
        <ProfessionalsQuickActions
          storeSlug={storeSlug}
          resetForm={editor.resetForm}
          setIsCreateDialogOpen={dialogs.setIsCreateDialogOpen}
        />

        {/* Tutorial, acesso do profissional e Google Calendar */}
        <ProfessionalsHelpCards isHelpOpen={isHelpOpen} setIsHelpOpen={setIsHelpOpen} />

        {/* KPI Summary */}
        <ProfessionalsKpiCards kpis={kpis} />

        {/* Filters & Search */}
        <ProfessionalsFilters
          kpis={kpis}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortOption={sortOption}
          setSortOption={setSortOption}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {/* Professional Cards */}
        <ProfessionalsGrid
          loadingProfessionals={loadingProfessionals}
          filteredProfessionals={filteredProfessionals}
          searchTerm={searchTerm}
          resetForm={editor.resetForm}
          setIsCreateDialogOpen={dialogs.setIsCreateDialogOpen}
          todayStats={todayStats}
          professionalServices={professionalServices}
          storeSlug={storeSlug}
          dialogs={dialogs}
          openEditDialog={editor.openEditDialog}
          handleToggleActive={editor.handleToggleActive}
          copyBookingLink={copyBookingLink}
        />

        <ProfessionalCreateDialog dialogs={dialogs} editor={editor} creatingProfessional={creatingProfessional} />

        <ProfessionalEditDialog dialogs={dialogs} editor={editor} updatingProfessional={updatingProfessional} />

        <ProfessionalDeleteDialog dialogs={dialogs} handleDelete={editor.handleDelete} deletingProfessional={deletingProfessional} />

        <ProfessionalToolDialogs dialogs={dialogs} editor={editor} storeId={storeId} storeName={storeName} />

      </div>
    </ModuleGate>
  );
};

export default ProfessionalsPage;
