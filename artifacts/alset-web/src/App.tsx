import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./lib/auth";
import { AppLayout } from "./components/layout";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Vehicles from "./pages/vehicles";
import Claims from "./pages/claims";
import WorkOrders from "./pages/work-orders";
import Towing from "./pages/towing";
import Rentals from "./pages/rentals";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Auth Guard Component
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="min-h-screen bg-[#050914] flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>;
  }

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function RootRedirect() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  useEffect(() => {
    if (isLoading) return;
    setLocation(isAuthenticated ? "/dashboard" : "/login");
  }, [isAuthenticated, isLoading, setLocation]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/vehicles"><ProtectedRoute component={Vehicles} /></Route>
      <Route path="/claims"><ProtectedRoute component={Claims} /></Route>
      <Route path="/work-orders"><ProtectedRoute component={WorkOrders} /></Route>
      <Route path="/towing"><ProtectedRoute component={Towing} /></Route>
      <Route path="/rentals"><ProtectedRoute component={Rentals} /></Route>
      <Route path="/" component={RootRedirect} />
      <Route>
        {() => (
          <div className="min-h-screen bg-[#050914] flex items-center justify-center text-white">
            <div className="text-center space-y-4">
              <h1 className="text-6xl font-bold text-primary">404</h1>
              <p className="text-white/60">Page not found in Alset Portal</p>
            </div>
          </div>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
