'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { ClipboardCheck, LogOut, Settings, UserCircle } from 'lucide-react';
import type { Teacher } from '@/lib/data';

const menuItems = [
  { href: '/teacher', label: 'My Class', icon: ClipboardCheck },
  { href: '/teacher/profile', label: 'Profile', icon: UserCircle },
];

function getInitials(name: string) {
  if (!name) return '';
  const names = name.split(' ');
  const initials = names.map(n => n[0]).join('');
  return initials.toUpperCase();
}


export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentTeacher, setCurrentTeacher] = React.useState<Teacher | null>(null);

  React.useEffect(() => {
    const teacherData = sessionStorage.getItem('currentTeacher');
    if (teacherData) {
      setCurrentTeacher(JSON.parse(teacherData));
    } else {
      router.push('/');
    }
  }, [router]);
  
  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/');
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label, side: 'right', align: 'center' }}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="justify-start gap-2 w-full px-2">
                     <Avatar className="h-8 w-8">
                        <AvatarImage src="https://picsum.photos/seed/1/40/40" alt={currentTeacher?.name || 'Teacher'} data-ai-hint="person face" />
                        <AvatarFallback>{currentTeacher ? getInitials(currentTeacher.name) : 'T'}</AvatarFallback>
                     </Avatar>
                     <div className="group-data-[collapsible=icon]:hidden flex flex-col text-left">
                        <span className="font-medium">{currentTeacher?.name || 'Teacher'}</span>
                        <span className="text-xs text-muted-foreground">Teacher</span>
                     </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="start">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
                <SidebarTrigger className="md:hidden" />
                <div className="flex-1">
                    <h1 className="text-lg font-semibold">Teacher Dashboard</h1>
                </div>
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-6">
                {children}
            </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}