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
  PlusCircle
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
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
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home, role: "all" },
  { title: "Generate Token", url: "/token", icon: PlusCircle, role: "all" },
  { title: "Queue Display", url: "/display", icon: Monitor, role: "all" },
  { title: "Queue Monitor", url: "/monitor", icon: Activity, role: "staff" },
];

const departmentItems = [
  { title: "Consultation", icon: Stethoscope, department: "Consultation" },
  { title: "Laboratory", icon: TestTube, department: "Lab" },
  { title: "Pharmacy", icon: Pill, department: "Pharmacy" },
  { title: "X-ray", icon: Radio, department: "X-ray" },
  { title: "Imaging", icon: ScanLine, department: "Scan" },
  { title: "Billing", icon: Receipt, department: "Billing" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { profile } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const collapsed = state === "collapsed";

  const canAccessStaff = profile?.role && profile.role !== 'patient';
  const isAdmin = profile?.role === 'admin';

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
                if (item.role === "staff" && !canAccessStaff) return null;
                
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

        {/* Department Quick Access - only for staff */}
        {canAccessStaff && (
          <SidebarGroup>
            <SidebarGroupLabel>Departments</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {departmentItems.map((item) => (
                  <SidebarMenuItem key={item.department}>
                    <SidebarMenuButton 
                      className={`
                        hover:bg-muted/50 text-muted-foreground hover:text-foreground
                        ${profile?.department === item.department ? 'bg-primary/5 text-primary' : ''}
                      `}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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
                  <SidebarMenuButton>
                    <BarChart3 className="h-4 w-4" />
                    {!collapsed && <span>Reports</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Settings className="h-4 w-4" />
                    {!collapsed && <span>Settings</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Users className="h-4 w-4" />
                    {!collapsed && <span>User Management</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
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