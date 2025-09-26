import { useState } from "react";
import { 
  Activity, 
  Settings, 
  BarChart3, 
  Users, 
  Stethoscope, 
  TestTube, 
  Pill, 
  Radio, 
  ScanLine, 
  Receipt,
  Home,
  Monitor,
  PlusCircle,
  ChevronDown,
  Building2,
  UserCog,
  Workflow,
  Eye,
  Volume2,
  FileText,
  Printer,
  Database
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home, permission: null },
  { title: "Generate Token", url: "/token", icon: PlusCircle, permission: "canGenerateTokens" },
  { title: "Queue Monitor", url: "/monitor", icon: Activity, permission: null },
  { title: "Queue Management", url: "/queue-management", icon: Users, permission: null },
  { title: "Public Display", url: "/display", icon: Monitor, permission: null },
];

const departmentItems = [
  { title: "Consultation", icon: Stethoscope, department: "Consultation" },
  { title: "Laboratory", icon: TestTube, department: "Lab" },
  { title: "Pharmacy", icon: Pill, department: "Pharmacy" },
  { title: "X-ray", icon: Radio, department: "X-ray" },
  { title: "Imaging", icon: ScanLine, department: "Scan" },
  { title: "Billing", icon: Receipt, department: "Billing" },
];

const adminSettingsItems = [
  { title: "General Settings", url: "/settings?tab=general", icon: Settings },
  { title: "Enterprise Settings", url: "/settings?tab=enterprise", icon: Building2 },
  { title: "Department Management", url: "/settings?tab=departments", icon: Building2 },
  { title: "User Management", url: "/settings?tab=users", icon: UserCog },
  { title: "Service Flows", url: "/settings?tab=flows", icon: Workflow },
  { title: "Queue Display Settings", url: "/settings?tab=display", icon: Eye },
  { title: "Voice & Announcements", url: "/settings?tab=announcements", icon: Volume2 },
  { title: "Ticket Templates", url: "/settings?tab=tickets", icon: FileText },
  { title: "Print Settings", url: "/settings?tab=print", icon: Printer },
  { title: "Reports & Analytics", url: "/settings?tab=reports", icon: Database },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { profile } = useAuth();
  const { hasPermission, isAdmin } = useRoleAccess();
  const location = useLocation();
  const currentPath = location.pathname;
  const [settingsOpen, setSettingsOpen] = useState(false);

  const isActive = (path: string) => currentPath === path;
  const isSettingsActive = () => currentPath.startsWith('/settings');
  const collapsed = state === "collapsed";

  const getRoleBasedTitle = () => {
    if (!profile?.role) return "Queue Management";
    
    switch (profile.role) {
      case 'admin':
        return "Admin Dashboard";
      case 'doctor':
        return "Doctor Portal";
      case 'receptionist':
        return "Reception Desk";
      case 'lab_technician':
        return "Lab Portal";
      case 'pharmacist':
        return "Pharmacy";
      case 'xray_technician':
        return "X-ray Portal";
      case 'imaging_technician':
        return "Imaging Portal";
      case 'billing_staff':
        return "Billing Portal";
      default:
        return "Staff Portal";
    }
  };

  const getRoleColor = () => {
    switch (profile?.role) {
      case 'doctor':
        return "text-blue-600";
      case 'admin':
        return "text-purple-600";
      case 'receptionist':
        return "text-green-600";
      default:
        return "text-primary";
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className={`p-2 rounded-lg bg-primary/10 ${getRoleColor()}`}>
            <Activity className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-sm text-foreground truncate">
                {getRoleBasedTitle()}
              </h2>
              {profile?.department && (
                <p className="text-xs text-muted-foreground truncate">
                  {profile.department}
                </p>
              )}
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                // Check permissions for this item
                if (item.permission && !hasPermission(item.permission as any)) return null;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      isActive={isActive(item.url)}
                      className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium"
                    >
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Department Quick Access - show current department for staff */}
        {profile?.department && !isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>My Department</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton className="bg-primary/5 text-primary">
                    <Activity className="h-4 w-4" />
                    {!collapsed && <span>{profile.department}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Tools */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive("/admin-dashboard")}
                    className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                  >
                    <NavLink to="/admin-dashboard" className="flex items-center gap-3">
                      <BarChart3 className="h-4 w-4" />
                      {!collapsed && <span>Admin Dashboard</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {/* Comprehensive Settings Menu */}
                <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton 
                        isActive={isSettingsActive()}
                        className="data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                      >
                        <Settings className="h-4 w-4" />
                        {!collapsed && <span>System Settings</span>}
                        {!collapsed && <ChevronDown className="ml-auto h-4 w-4 transition-transform data-[state=open]:rotate-180" />}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {adminSettingsItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton 
                              asChild
                              isActive={isActive(item.url) || (item.url.includes('tab=') && currentPath === '/settings' && location.search.includes(item.url.split('tab=')[1]))}
                            >
                              <NavLink to={item.url} className="flex items-center gap-3">
                                <item.icon className="h-4 w-4" />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        {profile && !collapsed && (
          <div className="px-2 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile.full_name}
                </p>
                <p className="text-xs text-muted-foreground capitalize truncate">
                  {profile.role}
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}