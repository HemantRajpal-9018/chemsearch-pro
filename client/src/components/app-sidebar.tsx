import {
  Search, FlaskConical, FileText, GitBranch, Columns2, List,
  Clock, Settings, Beaker, Zap, Sun, Moon
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const searchItems = [
  { title: "Structure Search", url: "/", icon: FlaskConical },
  { title: "Quick Search", url: "/quick-search", icon: Search },
  { title: "Reaction Search", url: "/reaction-search", icon: Zap },
  { title: "Batch Search", url: "/batch-search", icon: List },
];

const toolItems = [
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Retrosynthesis", url: "/retrosynthesis", icon: GitBranch },
  { title: "Compare", url: "/compare", icon: Columns2 },
];

const otherItems = [
  { title: "History", url: "/history", icon: Clock },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useHashLocation();
  const { theme, toggleTheme } = useTheme();

  const isActive = (url: string) => {
    if (url === "/" && (location === "/" || location === "/structure-search")) return true;
    return location === url;
  };

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <Beaker className="w-4.5 h-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight" data-testid="text-app-name">ChemSearch Pro</span>
            <span className="text-[10px] text-muted-foreground leading-none">Chemical Intelligence</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Search</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {searchItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      isActive(item.url) && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <Link href={item.url} data-testid={`nav-${item.url.replace("/", "") || "home"}`}>
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      isActive(item.url) && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <Link href={item.url} data-testid={`nav-${item.url.replace("/", "")}`}>
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Other</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      isActive(item.url) && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <Link href={item.url} data-testid={`nav-${item.url.replace("/", "")}`}>
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-3 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-start gap-2 text-muted-foreground"
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="text-sm">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
