import { Route } from "react-router-dom";
import { lazy } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProfessionalLayout } from "@/components/professional/ProfessionalLayout";
import { LazyRoute } from "@/components/LazyRoute";

const ProfessionalDashboard = lazy(() => import("@/pages/professional/ProfessionalDashboard"));
const ProfessionalAgenda = lazy(() => import("@/pages/professional/ProfessionalAgenda"));
const ProfessionalCommissions = lazy(() => import("@/pages/professional/ProfessionalCommissions"));
const ProfessionalSchedule = lazy(() => import("@/pages/professional/ProfessionalSchedule"));
const ProfessionalBlocks = lazy(() => import("@/pages/professional/ProfessionalBlocks"));
const ProfessionalProfile = lazy(() => import("@/pages/professional/ProfessionalProfile"));
const ProfessionalPerformance = lazy(() => import("@/pages/professional/ProfessionalPerformance"));
const ProfessionalGoogleCalendar = lazy(() => import("@/pages/professional/ProfessionalGoogleCalendar"));

export const professionalRoutes = (
  <>
    <Route path="/profissional" element={
      <ProtectedRoute allowedRoles={["professional"]}>
        <ProfessionalLayout><LazyRoute><ProfessionalDashboard /></LazyRoute></ProfessionalLayout>
      </ProtectedRoute>
    } />
    <Route path="/profissional/agenda" element={
      <ProtectedRoute allowedRoles={["professional"]}>
        <ProfessionalLayout><LazyRoute><ProfessionalAgenda /></LazyRoute></ProfessionalLayout>
      </ProtectedRoute>
    } />
    <Route path="/profissional/comissoes" element={
      <ProtectedRoute allowedRoles={["professional"]}>
        <ProfessionalLayout><LazyRoute><ProfessionalCommissions /></LazyRoute></ProfessionalLayout>
      </ProtectedRoute>
    } />
    <Route path="/profissional/horarios" element={
      <ProtectedRoute allowedRoles={["professional"]}>
        <ProfessionalLayout><LazyRoute><ProfessionalSchedule /></LazyRoute></ProfessionalLayout>
      </ProtectedRoute>
    } />
    <Route path="/profissional/bloqueios" element={
      <ProtectedRoute allowedRoles={["professional"]}>
        <ProfessionalLayout><LazyRoute><ProfessionalBlocks /></LazyRoute></ProfessionalLayout>
      </ProtectedRoute>
    } />
    <Route path="/profissional/perfil" element={
      <ProtectedRoute allowedRoles={["professional"]}>
        <ProfessionalLayout><LazyRoute><ProfessionalProfile /></LazyRoute></ProfessionalLayout>
      </ProtectedRoute>
    } />
    <Route path="/profissional/performance" element={
      <ProtectedRoute allowedRoles={["professional"]}>
        <ProfessionalLayout><LazyRoute><ProfessionalPerformance /></LazyRoute></ProfessionalLayout>
      </ProtectedRoute>
    } />
    <Route path="/profissional/google-calendar" element={
      <ProtectedRoute allowedRoles={["professional"]}>
        <ProfessionalLayout><LazyRoute><ProfessionalGoogleCalendar /></LazyRoute></ProfessionalLayout>
      </ProtectedRoute>
    } />
  </>
);
