import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Settings as SettingsIcon, Beaker, Info } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/50">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <SettingsIcon className="w-4 h-4 text-primary" />
        <h1 className="text-sm font-semibold" data-testid="text-page-title">Settings</h1>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4 max-w-2xl">
        <Card className="bg-card">
          <CardContent className="p-4 space-y-4">
            <h2 className="text-sm font-semibold">Appearance</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Toggle between light and dark themes</p>
              </div>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={toggleTheme}
                data-testid="button-settings-theme"
              >
                {theme === "dark" ? "Dark" : "Light"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 space-y-4">
            <h2 className="text-sm font-semibold">About ChemSearch Pro</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Beaker className="w-4 h-4 text-primary" />
                <span>Chemical Intelligence Platform</span>
              </div>
              <p className="text-xs">
                A professional chemical structure editor and search platform built for research.
                Powered by OpenChemLib for all chemistry operations.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="outline" className="text-[10px]">OpenChemLib v9</Badge>
                <Badge variant="outline" className="text-[10px]">React 18</Badge>
                <Badge variant="outline" className="text-[10px]">SQLite</Badge>
                <Badge variant="outline" className="text-[10px]">Express</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 space-y-4">
            <h2 className="text-sm font-semibold">Features</h2>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Structure drawing editor</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Exact, substructure, and similarity search</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> 60+ built-in chemical database</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> PDF upload and text extraction</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Reaction search</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Retrosynthesis planner</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Molecule comparison tool</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Batch search with CSV export</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary" /> Search history tracking</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
