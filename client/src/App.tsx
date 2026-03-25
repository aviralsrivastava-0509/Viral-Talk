import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { ThemeContext, useThemeState } from "@/hooks/use-theme";
import { Loader2 } from "lucide-react";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import GroupDetails from "@/pages/group-details";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-primary to-purple-400 rounded-xl animate-bounce flex items-center justify-center text-white font-bold text-xl">
            V
          </div>
          <p className="text-muted-foreground animate-pulse">Loading ViralTalk...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Switch>
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
  const themeValue = useThemeState();

  return (
    <ThemeContext.Provider value={themeValue}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeContext.Provider>
  );
}

export default App;
