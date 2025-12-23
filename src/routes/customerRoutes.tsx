import { Route } from "react-router-dom";
import { lazy } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LazyRoute } from "@/components/LazyRoute";

// Customer Pages - Lazy loaded
const CustomerProfile = lazy(() => import("@/pages/CustomerProfile"));

export const customerRoutes = (
  <>
    <Route path="/painel-cliente/:storeSlug/perfil" element={
      <ProtectedRoute allowedRoles={['customer']}>
        <LazyRoute><CustomerProfile /></LazyRoute>
      </ProtectedRoute>
    } />
  </>
);
