import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SalespersonLayout } from "@/components/salesperson/SalespersonLayout";

// Salesperson Pages
import SalespersonDashboard from "@/pages/salesperson/SalespersonDashboard";
import SalespersonMyLink from "@/pages/salesperson/SalespersonMyLink";
import SalespersonContract from "@/pages/salesperson/SalespersonContract";
import SalespersonProfile from "@/pages/salesperson/SalespersonProfile";
import SalespersonSharePage from "@/pages/salesperson/SalespersonSharePage";
import SalespersonUpgrade from "@/pages/salesperson/SalespersonUpgrade";
import SalespersonPayouts from "@/pages/salesperson/SalespersonPayouts";
import SalespersonGuidePage from "@/pages/salesperson/SalespersonGuidePage";
import SalespersonMediaPage from "@/pages/salesperson/SalespersonMediaPage";
import SalespersonClientsPage from "@/pages/salesperson/SalespersonClientsPage";
import SalespersonMyCommissionsPage from "@/pages/salesperson/SalespersonMyCommissionsPage";
import SalespersonContractHistory from "@/pages/salesperson/SalespersonContractHistory";
import SalespersonContractPreview from "@/pages/salesperson/SalespersonContractPreview";
import SalespersonLeadsPage from "@/pages/salesperson/SalespersonLeadsPage";
import OnboardingGuidePage from "@/pages/salesperson/OnboardingGuidePage";
import SalesPromptsPage from "@/pages/admin/SalesPromptsPage";
import ProspectingGuidePage from "@/pages/admin/ProspectingGuidePage";
import SystemUpdatesPage from "@/pages/SystemUpdatesPage";

export const salespersonRoutes = (
  <>
    <Route path="/vendedor" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <SalespersonDashboard />
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/guia" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <SalespersonGuidePage />
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/link" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <SalespersonMyLink />
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/pagamentos" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <SalespersonPayouts />
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/clientes" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <SalespersonClientsPage />
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/comissoes" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <SalespersonMyCommissionsPage />
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/midias" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <SalespersonMediaPage />
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/prompts" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <SalesPromptsPage />
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/prospeccao" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <ProspectingGuidePage />
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/onboarding" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <OnboardingGuidePage />
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/contrato" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <SalespersonContract />
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/perfil" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <SalespersonProfile />
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/upgrade" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonUpgrade />
      </ProtectedRoute>
    } />
    <Route path="/vendedor/contratos" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout><SalespersonContractHistory /></SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/contrato/previa" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonContractPreview />
      </ProtectedRoute>
    } />
    <Route path="/vendedor/leads" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <SalespersonLeadsPage />
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/compartilhar" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <SalespersonSharePage />
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/novidades" element={
      <ProtectedRoute allowedRoles={['salesperson']}>
        <SalespersonLayout>
          <SystemUpdatesPage />
        </SalespersonLayout>
      </ProtectedRoute>
    } />
  </>
);
