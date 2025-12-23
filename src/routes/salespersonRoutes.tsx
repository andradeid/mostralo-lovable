import { Route } from "react-router-dom";
import { lazy } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SalespersonLayout } from "@/components/salesperson/SalespersonLayout";
import { LazyRoute } from "@/components/LazyRoute";

// Salesperson Pages - Lazy loaded
const SalespersonDashboard = lazy(() => import("@/pages/salesperson/SalespersonDashboard"));
const SalespersonMyLink = lazy(() => import("@/pages/salesperson/SalespersonMyLink"));
const SalespersonContract = lazy(() => import("@/pages/salesperson/SalespersonContract"));
const SalespersonProfile = lazy(() => import("@/pages/salesperson/SalespersonProfile"));
const SalespersonSharePage = lazy(() => import("@/pages/salesperson/SalespersonSharePage"));
const SalespersonUpgrade = lazy(() => import("@/pages/salesperson/SalespersonUpgrade"));
const SalespersonPayouts = lazy(() => import("@/pages/salesperson/SalespersonPayouts"));
const SalespersonGuidePage = lazy(() => import("@/pages/salesperson/SalespersonGuidePage"));
const SalespersonMediaPage = lazy(() => import("@/pages/salesperson/SalespersonMediaPage"));
const SalespersonClientsPage = lazy(() => import("@/pages/salesperson/SalespersonClientsPage"));
const SalespersonMyCommissionsPage = lazy(() => import("@/pages/salesperson/SalespersonMyCommissionsPage"));
const SalespersonContractHistory = lazy(() => import("@/pages/salesperson/SalespersonContractHistory"));
const SalespersonContractPreview = lazy(() => import("@/pages/salesperson/SalespersonContractPreview"));
const SalespersonLeadsPage = lazy(() => import("@/pages/salesperson/SalespersonLeadsPage"));
const OnboardingGuidePage = lazy(() => import("@/pages/salesperson/OnboardingGuidePage"));
const SalesPromptsPage = lazy(() => import("@/pages/admin/SalesPromptsPage"));
const ProspectingGuidePage = lazy(() => import("@/pages/admin/ProspectingGuidePage"));
const SystemUpdatesPage = lazy(() => import("@/pages/SystemUpdatesPage"));

export const salespersonRoutes = (
  <>
    <Route path="/vendedor" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <LazyRoute><SalespersonDashboard /></LazyRoute>
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/guia" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <LazyRoute><SalespersonGuidePage /></LazyRoute>
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/link" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <LazyRoute><SalespersonMyLink /></LazyRoute>
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/pagamentos" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <LazyRoute><SalespersonPayouts /></LazyRoute>
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/clientes" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <LazyRoute><SalespersonClientsPage /></LazyRoute>
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/comissoes" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <LazyRoute><SalespersonMyCommissionsPage /></LazyRoute>
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/midias" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <LazyRoute><SalespersonMediaPage /></LazyRoute>
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/prompts" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <LazyRoute><SalesPromptsPage /></LazyRoute>
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/prospeccao" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <LazyRoute><ProspectingGuidePage /></LazyRoute>
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/onboarding" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <LazyRoute><OnboardingGuidePage /></LazyRoute>
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/contrato" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <LazyRoute><SalespersonContract /></LazyRoute>
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/perfil" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <LazyRoute><SalespersonProfile /></LazyRoute>
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/upgrade" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <LazyRoute><SalespersonUpgrade /></LazyRoute>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/contratos" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <LazyRoute><SalespersonContractHistory /></LazyRoute>
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/contrato/previa" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <LazyRoute><SalespersonContractPreview /></LazyRoute>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/leads" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <LazyRoute><SalespersonLeadsPage /></LazyRoute>
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/compartilhar" element={
      <ProtectedRoute allowedRoles={["salesperson"]}>
        <SalespersonLayout>
          <LazyRoute><SalespersonSharePage /></LazyRoute>
        </SalespersonLayout>
      </ProtectedRoute>
    } />
    <Route path="/vendedor/novidades" element={
      <ProtectedRoute allowedRoles={['salesperson']}>
        <SalespersonLayout>
          <LazyRoute><SystemUpdatesPage /></LazyRoute>
        </SalespersonLayout>
      </ProtectedRoute>
    } />
  </>
);
