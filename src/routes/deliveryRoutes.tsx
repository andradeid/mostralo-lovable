import { Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DeliveryDriverLayout } from "@/components/delivery/DeliveryDriverLayout";

// Delivery Driver Pages
import DeliveryDriverPanel from "@/pages/DeliveryDriverPanel";
import DeliveryDriverReports from "@/pages/DeliveryDriverReports";
import DeliveryDriverPayments from "@/pages/DeliveryDriverPayments";
import DeliveryDriverProfile from "@/pages/DeliveryDriverProfile";
import DeliverySettingsPage from "@/pages/DeliverySettingsPage";
import SystemUpdatesPage from "@/pages/SystemUpdatesPage";

export const deliveryRoutes = (
  <>
    <Route path="/delivery-panel" element={
      <ProtectedRoute allowedRoles={['delivery_driver']}>
        <DeliveryDriverLayout>
          <DeliveryDriverPanel />
        </DeliveryDriverLayout>
      </ProtectedRoute>
    } />
    <Route path="/delivery-reports" element={
      <ProtectedRoute allowedRoles={['delivery_driver']}>
        <DeliveryDriverLayout>
          <DeliveryDriverReports />
        </DeliveryDriverLayout>
      </ProtectedRoute>
    } />
    <Route path="/delivery-payments" element={
      <ProtectedRoute allowedRoles={['delivery_driver']}>
        <DeliveryDriverLayout>
          <DeliveryDriverPayments />
        </DeliveryDriverLayout>
      </ProtectedRoute>
    } />
    <Route path="/delivery-profile" element={
      <ProtectedRoute allowedRoles={['delivery_driver']}>
        <DeliveryDriverLayout>
          <DeliveryDriverProfile />
        </DeliveryDriverLayout>
      </ProtectedRoute>
    } />
    <Route path="/delivery-settings" element={
      <ProtectedRoute allowedRoles={['delivery_driver']}>
        <DeliveryDriverLayout>
          <DeliverySettingsPage />
        </DeliveryDriverLayout>
      </ProtectedRoute>
    } />
    <Route path="/entregador/novidades" element={
      <ProtectedRoute allowedRoles={['delivery_driver']}>
        <DeliveryDriverLayout>
          <SystemUpdatesPage />
        </DeliveryDriverLayout>
      </ProtectedRoute>
    } />
  </>
);
