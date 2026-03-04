/**
 * @file src/app/student/profile/page.tsx
 * @fileoverview The profile page for the Student role. Corresponds to the "/student/profile" route.
 * Displays the student's personal information and the detailed grading criteria for their level.
 */
'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type Student, type Grade } from '@/lib/data';
import { getGradeByStudentAndLevel } from '@/lib/firebase-actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';

function getInitials(name: string) {
  if (!name) return '';
  const names = name.split(' ');
  const initials = names.map(n => n[0]).join('');
  return initials.toUpperCase();
}


export default function StudentProfilePage() {
  const [currentUser, setCurrentUser] = React.useState<Student | null>(null);
  const [studentGrade, setStudentGrade] = React.useState<Grade | null>(null);
  
  const totalPossiblePoints = React.useMemo(() => {
    return studentGrade?.assignmentGrades.reduce((acc, item) => acc + (item.points || 0), 0) || 0;
  }, [studentGrade]);

  const totalEarnedPoints = React.useMemo(() => {
     return studentGrade?.assignmentGrades.reduce((acc, item) => {
        const grade = parseFloat(String(item.grade));
        return acc + (isNaN(grade) ? 0 : grade);
    }, 0) || 0;
  }, [studentGrade]);


  React.useEffect(() => {
    const userJson = sessionStorage.getItem('currentUser');
    const user = userJson ? JSON.parse(userJson) : null;
    setCurrentUser(user);

    if (user) {
        const fetchGrade = async () => {
            const grade = await getGradeByStudentAndLevel(user.studentId, user.level);
            if (grade) {
                setStudentGrade(grade);
            }
        };
        fetchGrade();
    }
  }, []);

  if (!currentUser) {
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
                <AvatarImage src="https://picsum.photos/seed/1/80/80" alt="Student" data-ai-hint="person student"/>
                <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
            </Avatar>
            <div>
                <h3 className="text-lg font-semibold">{currentUser.name}</h3>
                <p className="text-sm text-muted-foreground">Student ID: {currentUser.studentId}</p>
            </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={currentUser.name} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue={currentUser.email} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="level">Current Level</Label>
                    <Input id="level" defaultValue={currentUser.level} readOnly />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="teacher">Teacher</Label>
                    <Input id="teacher" defaultValue={currentUser.teacher} readOnly />
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
                <CardTitle>Grading Criteria</CardTitle>
                <CardDescription>This is how your final grade is calculated for your level.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Assignment / Component</TableHead>
                                <TableHead className="text-center w-[120px]">Your Grade</TableHead>
                                <TableHead className="text-center w-[120px]">Possible Points</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {studentGrade && studentGrade.assignmentGrades.length > 0 ? (
                                studentGrade.assignmentGrades.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{item.title}</TableCell>
                                        <TableCell className="text-center font-semibold">
                                            {String(item.grade) || 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground">
                                            {item.points || 'N/A'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                                        No grading criteria available yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        <TableFooter className="bg-muted/50">
                            <TableRow>
                                <TableCell className="font-bold text-right">Total</TableCell>
                                <TableCell className="text-center font-bold text-lg">{totalEarnedPoints}</TableCell>
                                <TableCell className="text-center font-bold text-lg text-muted-foreground">{totalPossiblePoints}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}