import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import StructureSearch from "@/pages/structure-search";
import QuickSearch from "@/pages/quick-search";
import ReactionSearch from "@/pages/reaction-search";
import Documents from "@/pages/documents";
import Retrosynthesis from "@/pages/retrosynthesis";
import Compare from "@/pages/compare";
import BatchSearch from "@/pages/batch-search";
import History from "@/pages/history";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={StructureSearch} />
      <Route path="/structure-search" component={StructureSearch} />
      <Route path="/quick-search" component={QuickSearch} />
      <Route path="/reaction-search" component={ReactionSearch} />
      <Route path="/documents" component={Documents} />
      <Route path="/retrosynthesis" component={Retrosynthesis} />
      <Route path="/compare" component={Compare} />
      <Route path="/batch-search" component={BatchSearch} />
      <Route path="/history" component={History} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

const sidebarStyle = {
  "--sidebar-width": "15rem",
  "--sidebar-width-icon": "3.5rem",
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Router hook={useHashLocation}>
            <SidebarProvider style={sidebarStyle as React.CSSProperties}>
              <div className="flex h-screen w-full overflow-hidden">
                <AppSidebar />
                <main className="flex-1 overflow-auto">
                  <AppRouter />
                </main>
              </div>
            </SidebarProvider>
            <Toaster />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
