import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { ThemeContext, useThemeState } from "@/hooks/use-theme";

import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import GroupDetails from "@/pages/group-details";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-violet-400/20 blur-2xl scale-110" />
            <img
              src="/viraltalk-logo.png"
              alt="ViralTalk"
              className="relative h-20 w-auto animate-pulse drop-shadow-lg"
            />
          </div>
          <p className="text-sm text-muted-foreground tracking-wide">Loading ViralTalk…</p>
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
