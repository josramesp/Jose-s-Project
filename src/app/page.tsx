/**
 * @file src/app/page.tsx
 * @fileoverview The main login page for the application. Corresponds to the "/" route.
 * This component renders the login forms for all three user roles: Student, Teacher, and Admin.
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStudentByStudentId, getTeacherByUsername, getAdminByUsername, addAdmin } from '@/lib/firebase-actions';
import type { Admin } from '@/lib/data';

export default function LoginPage() {
  const [studentId, setStudentId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const student = await getStudentByStudentId(studentId);

    if (student && student.password === studentPassword) {
      sessionStorage.setItem('currentUser', JSON.stringify(student));
      sessionStorage.removeItem('currentTeacher');
      sessionStorage.removeItem('currentAdmin');
      router.push('/student');
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid Student ID or Password.',
      });
    }
  };
  
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const teacher = await getTeacherByUsername(teacherUsername);

    if (teacher && teacher.password === teacherPassword) {
      sessionStorage.setItem('currentTeacher', JSON.stringify(teacher));
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentAdmin');
      router.push('/teacher');
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid Username or Password.',
      });
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    let admin = await getAdminByUsername(adminUsername);

    // If default admin is being used and doesn't exist, create it.
    if (!admin && adminUsername === 'admin') {
        console.log("Default admin not found, creating one...");
        try {
            const defaultAdminData: Omit<Admin, 'id'> = { name: 'Administrator', username: 'admin', password: 'password' };
            const newId = await addAdmin(defaultAdminData);
            admin = { ...defaultAdminData, id: newId };
            console.log("Default admin created successfully.");
        } catch (error) {
            console.error("Failed to create default admin:", error);
            toast({
                variant: 'destructive',
                title: 'Setup Error',
                description: 'Could not create the default admin account.',
            });
            return;
        }
    }

    if (admin && admin.password === adminPassword) {
      sessionStorage.setItem('currentAdmin', JSON.stringify(admin));
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentTeacher');
      router.push('/admin/students');
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid Admin Username or Password.',
      });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="student">Student</TabsTrigger>
            <TabsTrigger value="teacher">Teacher</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
          
          <TabsContent value="student">
             <form onSubmit={handleStudentLogin}>
              <Card>
                <CardHeader>
                  <CardTitle>Student Login</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input 
                      id="studentId" 
                      type="text" 
                      placeholder="e.g. S001" 
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentPassword">Password</Label>
                    <Input 
                      id="studentPassword" 
                      type="password"
                      value={studentPassword}
                      onChange={(e) => setStudentPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" type="submit">Login as Student</Button>
                </CardFooter>
              </Card>
          </form>
          </TabsContent>

          <TabsContent value="teacher">
             <form onSubmit={handleTeacherLogin}>
              <Card>
                <CardHeader>
                  <CardTitle>Teacher Login</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="teacherUsername">Username</Label>
                    <Input 
                      id="teacherUsername" 
                      type="text" 
                      placeholder="e.g. jdoe" 
                      value={teacherUsername}
                      onChange={(e) => setTeacherUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacherPassword">Password</Label>
                    <Input 
                      id="teacherPassword" 
                      type="password"
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" type="submit">Login as Teacher</Button>
                </CardFooter>
              </Card>
          </form>
          </TabsContent>

          <TabsContent value="admin">
              <form onSubmit={handleAdminLogin}>
              <Card>
                <CardHeader>
                  <CardTitle>Admin Login</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminUsername">Admin Username</Label>
                    <Input 
                      id="adminUsername" 
                      type="text" 
                      placeholder="e.g. admin" 
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Admin Password</Label>
                    <Input 
                      id="adminPassword" 
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" type="submit">Login as Admin</Button>
                </CardFooter>
              </Card>
              </form>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}