/**
 * @file src/app/teacher/profile/page.tsx
 * @fileoverview The profile page for the Teacher role. Corresponds to the "/teacher/profile" route.
 * Displays the teacher's personal information, their assigned levels, and a list of all students
 * assigned to them across all their levels.
 */
'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/lib/ui/badge';
import { type Teacher, type Student } from '@/lib/data';
import { getStudents } from '@/lib/firebase-actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function getInitials(name: string) {
  if (!name) return '';
  const names = name.split(' ');
  const initials = names.map(n => n[0]).join('');
  return initials.toUpperCase();
}


export default function TeacherProfilePage() {
  const [currentTeacher, setCurrentTeacher] = React.useState<Teacher | null>(null);
  const [students, setStudents] = React.useState<Student[]>([]);

  React.useEffect(() => {
    const teacherJson = sessionStorage.getItem('currentTeacher');
    const teacher = teacherJson ? JSON.parse(teacherJson) : null;
    setCurrentTeacher(teacher);
    if (teacher) {
        const fetchStudents = async () => {
            const allStudents = await getStudents();
            const assignedStudents = allStudents.filter(s => s.teacher === teacher.name);
            setStudents(assignedStudents);
        }
        fetchStudents();
    }
  }, []);

  if (!currentTeacher) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>My Profile</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Loading profile...</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle>My Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src="https://picsum.photos/seed/1/80/80" alt={currentTeacher.name} data-ai-hint="person face"/>
                    <AvatarFallback>{getInitials(currentTeacher.name)}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="text-lg font-semibold">{currentTeacher.name}</h3>
                    <p className="text-sm text-muted-foreground">Username: {currentTeacher.username}</p>
                </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue={currentTeacher.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Assigned Levels</Label>
                         <div className="flex flex-wrap gap-2">
                            {currentTeacher.level.split(',').map(l => l.trim()).filter(Boolean).map(level => (
                                <Badge key={level} variant="secondary">{level}</Badge>
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input id="password" type="password" placeholder="••••••••" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" placeholder="••••••••" />
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Update Profile</Button>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>My Students</CardTitle>
                 <CardDescription>
                    A list of all students assigned to your classes.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Level</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {students.map(student => (
                                <TableRow key={student.id}>
                                    <TableCell>{student.studentId}</TableCell>
                                    <TableCell className="font-medium">{student.name}</TableCell>
                                    <TableCell><Badge variant="outline">{student.level}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}