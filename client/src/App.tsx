import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import GroupDetails from "@/pages/group-details";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any> }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect logic handled in landing page normally, or explicit here
    // But for better UX, we just show Landing if not logged in on root
    // For protected routes, maybe redirect or show unauthorized
    // For now, let's just return Landing if not user
    return <Landing />;
  }

  return <Component {...rest} />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-xl animate-bounce flex items-center justify-center text-white font-bold text-xl">
            F
          </div>
          <p className="text-muted-foreground animate-pulse">Loading FriendGroup...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Switch>
        {/* If user is logged in, root goes to dashboard. If not, Landing */}
        <Route path="/">
          {user ? <Dashboard /> : <Landing />}
        </Route>
        
        <Route path="/groups/:id">
          {user ? <GroupDetails /> : <Landing />}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
