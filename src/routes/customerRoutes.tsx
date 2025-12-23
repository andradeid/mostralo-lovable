import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import CustomerProfile from "@/pages/CustomerProfile";

export const customerRoutes = (
  <>
    <Route path="/painel-cliente/:storeSlug/perfil" element={
      <ProtectedRoute allowedRoles={['customer']}>
        <CustomerProfile />
      </ProtectedRoute>
    } />
  </>
);
