import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import Layout from "@/components/layout";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import DashboardPage from "@/pages/dashboard";
import PatientsPage from "@/pages/patients";
import DoctorsPage from "@/pages/doctors";
import AppointmentsPage from "@/pages/appointments";
import MedicalRecordsPage from "@/pages/medical-records";
import PrescriptionsPage from "@/pages/prescriptions";
import BillingPage from "@/pages/billing";
import NotificationsPage from "@/pages/notifications";
import ClinicsPage from "@/pages/clinics";
import SchedulePage from "@/pages/schedule";
import DrugsPage from "@/pages/drugs";
import LandingPage from "@/pages/landing";
import ProfilePage from "@/pages/profile";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  const { role } = useAuth();

  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/dashboard">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      {role == "ADMIN" && (
        <>
          <Route path="/patients">
            <ProtectedRoute component={PatientsPage} />
          </Route>
          <Route path="/doctors">
            <ProtectedRoute component={DoctorsPage} />
          </Route>
          <Route path="/clinics">
            <ProtectedRoute component={ClinicsPage} />
          </Route>
          <Route path="/drugs">
            <ProtectedRoute component={DrugsPage} />
          </Route>
          <Route path="/billing">
            <ProtectedRoute component={BillingPage} />
          </Route>
          <Route path="/billing/revenue">
            <ProtectedRoute component={BillingPage} />
          </Route>
          <Route path="/settings">
            <ProtectedRoute component={SettingsPage} />
          </Route>
        </>
      )}

      {role == "DOCTOR" && (
        <>
          <Route path="/schedule">
            <ProtectedRoute component={SchedulePage} />
          </Route>
          <Route path="/drugs">
            <ProtectedRoute component={DrugsPage} />
          </Route>
          <Route path="/billing">
            <ProtectedRoute component={BillingPage} />
          </Route>
          <Route path="/billing/profit">
            <ProtectedRoute component={BillingPage} />
          </Route>
        </>
      )}

      {role == "PATIENT" && (
        <>
          <Route path="/billing/bills">
            <ProtectedRoute component={BillingPage} />
          </Route>
          <Route path="/profile">
            <ProtectedRoute component={ProfilePage} />
          </Route>
        </>
      )}

      <Route path="/billing">
        <ProtectedRoute component={BillingPage} />
      </Route>
      <Route path="/appointments">
        <ProtectedRoute component={AppointmentsPage} />
      </Route>
      <Route path="/medical-records">
        <ProtectedRoute component={MedicalRecordsPage} />
      </Route>
      <Route path="/prescriptions">
        <ProtectedRoute component={PrescriptionsPage} />
      </Route>
      <Route path="/notifications">
        <ProtectedRoute component={NotificationsPage} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
