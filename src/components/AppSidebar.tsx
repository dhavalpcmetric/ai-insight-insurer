import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, Workflow, Settings, Sparkles, Upload, Plug } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const workspace = [
  { title: "Executive Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Lead Intelligence", url: "/leads", icon: Users },
  { title: "AI Workflow", url: "/workflow", icon: Workflow },
];

const data = [
  { title: "Upload Leads", url: "/upload", icon: Upload },
  { title: "Integrations", url: "/integrations", icon: Plug },
];

const admin = [{ title: "Settings", url: "/settings", icon: Settings }];

export function AppSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });

  const renderGroup = (label: string, items: { title: string; url: string; icon: any }[]) => (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = item.url === "/" ? currentPath === "/" : currentPath.startsWith(item.url);
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <Link to={item.url} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold">Insurance AI</span>
            <span className="text-xs text-muted-foreground">Pricing & Leads</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Workspace", workspace)}
        {renderGroup("Data", data)}
        {renderGroup("Admin", admin)}
      </SidebarContent>
    </Sidebar>
  );
}
