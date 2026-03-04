/**
 * @file src/app/admin/students/page.tsx
 * @fileoverview Admin student management page. Corresponds to the "/admin/students" route.
 * This is the main page for admins to manage all students. It allows for full CRUD operations,
 * impersonating a student, and bulk importing students from an Excel file.
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as xlsx from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, Upload, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { type Student, type Teacher, type Level } from '@/lib/data';
import { 
    getStudents, getLevels, addStudent, updateStudent, deleteStudent,
    getTeacherByName, updateTeacher, addTeacher,
    getLevelByName, updateLevel, addLevel, batchAddStudents
} from '@/lib/firebase-actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentStudent, setCurrentStudent] = useState<Partial<Student> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const studentList = await getStudents();
        const levelList = await getLevels();
        setStudents(studentList);
        setLevels(levelList);
    };

    const handleAddClick = () => {
        setCurrentStudent({ dropped: false });
        setIsDialogOpen(true);
    };

    const handleEditClick = (student: Student) => {
        setCurrentStudent(student);
        setIsDialogOpen(true);
    };

    const handleDeleteClick = async (studentId: string) => {
        const studentToDelete = students.find(s => s.id === studentId);
        if (!studentToDelete) return;

        await deleteStudent(studentId);
        await fetchData(); // Refresh data

        // Decrement teacher student count
        const teacher = await getTeacherByName(studentToDelete.teacher);
        if (teacher && teacher.students > 0) {
            await updateTeacher(teacher.id, { students: teacher.students - 1 });
        }

        // Remove student from level
        const level = await getLevelByName(studentToDelete.level);
        if (level) {
            const studentNames = level.students.split(', ').filter(name => name !== studentToDelete.name);
            await updateLevel(level.id, { students: studentNames.join(', ') });
        }
    };

    const handleImpersonateClick = (student: Student) => {
        sessionStorage.setItem('currentUser', JSON.stringify(student));
        sessionStorage.removeItem('currentTeacher');
        router.push('/student');
    };

    const handleSaveChanges = async () => {
        if (!currentStudent) return;

        try {
            if (currentStudent.id) {
                // Edit existing student
                await updateStudent(currentStudent.id, currentStudent);
            } else {
                // Add new student, ensure all fields are present
                const newStudentData: Omit<Student, 'id'> = {
                    name: currentStudent.name || '',
                    email: currentStudent.email || '',
                    level: currentStudent.level || '',
                    teacher: currentStudent.teacher || '',
                    studentId: currentStudent.studentId || '',
                    password: currentStudent.password || 'password', // Default password
                    dropped: currentStudent.dropped || false,
                };
                await addStudent(newStudentData);
            }
            await fetchData();
            setIsDialogOpen(false);
            setCurrentStudent(null);
            toast({ title: "Success", description: "Student data saved." });
        } catch (error) {
            console.error("Failed to save student", error);
            toast({ variant: "destructive", title: "Error", description: "Could not save student data." });
        }
    };

    const handleDialogClose = () => {
        setIsDialogOpen(false);
        setCurrentStudent(null);
    }

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = xlsx.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = xlsx.utils.sheet_to_json<any>(worksheet);

                const allStudents = await getStudents();
                const currentMaxStudentIdNumber = allStudents.length > 0 
                    ? Math.max(...allStudents.map(s => parseInt(s.studentId.replace('S',''), 10) || 0))
                    : 0;

                const newStudents: Omit<Student, 'id'>[] = json.map((row: any, index: number) => ({
                    studentId: row['Student ID'] || `S${String(currentMaxStudentIdNumber + 1 + index).padStart(3, '0')}`,
                    password: String(row['Password']) || 'password',
                    name: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
                    level: row['Level'] || 'Unassigned',
                    teacher: row['Teacher'] || 'Unassigned',
                    email: row['Email'] || '',
                    dropped: row['Dropped'] === true || String(row['Dropped']).toLowerCase() === 'true',
                }));

                // Batch add new students
                await batchAddStudents(newStudents);

                // This part is complex and better handled by a backend script, but for client-side...
                // We refetch everything and then recalculate associations.
                const updatedStudents = await getStudents();
                const updatedTeachers = await getTeachers();
                const updatedLevels = await getLevels();
                
                const teacherMap = new Map<string, { levelSet: Set<string>, studentCount: number, id?: string }>();
                const levelMap = new Map<string, { teacherSet: Set<string>, studentSet: Set<string>, id?: string }>();
                
                updatedTeachers.forEach(t => teacherMap.set(t.name, { levelSet: new Set(t.level.split(', ')), studentCount: t.students, id: t.id }));
                updatedLevels.forEach(l => levelMap.set(l.name, { teacherSet: new Set(l.teachers.split(', ')), studentSet: new Set(l.students.split(', ')), id: l.id }));


                updatedStudents.forEach(student => {
                    // Update teacher map
                    if (!teacherMap.has(student.teacher)) teacherMap.set(student.teacher, { levelSet: new Set(), studentCount: 0 });
                    const teacherInfo = teacherMap.get(student.teacher)!;
                    teacherInfo.levelSet.add(student.level);

                    // Update level map
                    if (!levelMap.has(student.level)) levelMap.set(student.level, { teacherSet: new Set(), studentSet: new Set() });
                    const levelInfo = levelMap.get(student.level)!;
                    levelInfo.teacherSet.add(student.teacher);
                    levelInfo.studentSet.add(student.name);
                });
                
                // Recalculate student counts for all teachers
                teacherMap.forEach(info => info.studentCount = 0);
                updatedStudents.forEach(student => {
                    if (teacherMap.has(student.teacher)) {
                        teacherMap.get(student.teacher)!.studentCount++;
                    }
                })


                // Update or create teachers
                for (const [name, info] of teacherMap.entries()) {
                    const teacherData = {
                        name,
                        username: name.toLowerCase().replace(/\s/g, ''),
                        password: 'password',
                        level: Array.from(info.levelSet).join(', '),
                        students: info.studentCount,
                    };
                    if (info.id) {
                       await updateTeacher(info.id, teacherData);
                    } else {
                       await addTeacher(teacherData);
                    }
                }

                // Update or create levels
                for (const [name, info] of levelMap.entries()) {
                    const levelData = {
                        name,
                        teachers: Array.from(info.teacherSet).join(', '),
                        students: Array.from(info.studentSet).join(', '),
                    }
                    if (info.id) {
                       await updateLevel(info.id, levelData);
                    } else {
                       await addLevel(levelData);
                    }
                }

                await fetchData(); // Final refresh to get all data
                toast({
                    title: "Import Successful",
                    description: `${newStudents.length} students, and associated teachers/levels have been added/updated.`,
                });

            } catch (error) {
                console.error("Failed to parse Excel file", error);
                toast({
                    variant: "destructive",
                    title: "Import Failed",
                    description: "Could not read the student data from the Excel file. Please check the file format.",
                });
            }
        };
        reader.readAsArrayBuffer(file);
        
        event.target.value = '';
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <CardTitle>Students</CardTitle>
                    <div className="flex items-center gap-2">
                         <Button size="sm" variant="outline" onClick={handleImportClick}>
                            <Upload className="h-4 w-4 mr-2" />
                            Import from Excel
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".xlsx, .xls"
                        />
                        <Button size="sm" onClick={handleAddClick}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add Student
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student ID</TableHead>
                                    <TableHead>Password</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Level</TableHead>
                                    <TableHead>Teacher</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell>{student.studentId}</TableCell>
                                        <TableCell>{student.password}</TableCell>
                                        <TableCell className="font-medium">{student.name}</TableCell>
                                        <TableCell>{student.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{student.level}</Badge>
                                        </TableCell>
                                        <TableCell>{student.teacher}</TableCell>
                                        <TableCell>
                                            <Badge variant={student.dropped ? 'destructive' : 'secondary'}>
                                                {student.dropped ? 'Dropped' : 'Active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEditClick(student)}>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleImpersonateClick(student)}>
                                                        <User className="mr-2 h-4 w-4" />
                                                        Impersonate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteClick(student.id)}>Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{currentStudent?.id ? 'Edit Student' : 'Add New Student'}</DialogTitle>
                        <DialogDescription>
                            {currentStudent?.id ? 'Make changes to the student details here.' : 'Enter the details for the new student.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="studentId" className="text-right">ID</Label>
                            <Input id="studentId" value={currentStudent?.studentId || ''} onChange={(e) => setCurrentStudent({ ...currentStudent, studentId: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={currentStudent?.name || ''} onChange={(e) => setCurrentStudent({ ...currentStudent, name: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input id="email" value={currentStudent?.email || ''} onChange={(e) => setCurrentStudent({ ...currentStudent, email: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">Password</Label>
                            <Input id="password" type="password" value={currentStudent?.password || ''} onChange={(e) => setCurrentStudent({ ...currentStudent, password: e.target.value })} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="level" className="text-right">Level</Label>
                             <Select
                                value={currentStudent?.level || ''}
                                onValueChange={(value) => setCurrentStudent({ ...currentStudent, level: value })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a level" />
                                </SelectTrigger>
                                <SelectContent>
                                    {levels.map((level) => (
                                        <SelectItem key={level.id} value={level.name}>
                                            {level.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="teacher" className="text-right">Teacher</Label>
                            <Input id="teacher" value={currentStudent?.teacher || ''} onChange={(e) => setCurrentStudent({ ...currentStudent, teacher: e.target.value })} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dropped" className="text-right">Status</Label>
                             <div className="col-span-3 flex items-center space-x-2">
                                <Checkbox
                                    id="dropped"
                                    checked={currentStudent?.dropped || false}
                                    onCheckedChange={(checked) => setCurrentStudent({ ...currentStudent, dropped: !!checked })}
                                />
                                 <label
                                    htmlFor="dropped"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Mark as Dropped
                                </label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveChanges}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}