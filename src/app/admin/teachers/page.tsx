/**
 * @file src/app/admin/teachers/page.tsx
 * @fileoverview Admin teacher management page. Corresponds to the "/admin/teachers" route.
 * This page allows admins to perform CRUD operations on teachers, assign them to levels,
 * and jump to their gradebook view via "Manage Class".
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, UserCog, Edit, Trash2, ChevronsUpDown, Check, XIcon } from 'lucide-react';
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
import { type Teacher, type Level } from '@/lib/data';
import { 
    getTeachers, getLevels, getStudents, addTeacher, updateTeacher, deleteTeacher, updateStudent
} from '@/lib/firebase-actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


export default function TeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
    const [currentTeacher, setCurrentTeacher] = useState<Partial<Teacher> | null>(null);
    const [selectedLevels, setSelectedLevels] = useState<Level[]>([]);
    const [isLevelPickerOpen, setLevelPickerOpen] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);
    
    const fetchData = async () => {
        const teacherList = await getTeachers();
        const levelList = await getLevels();
        setTeachers(teacherList);
        setLevels(levelList);
    };

    const handleAddClick = () => {
        setCurrentTeacher({});
        setSelectedLevels([]);
        setIsDialogOpen(true);
    };

    const handleEditClick = (teacher: Teacher) => {
        setCurrentTeacher(teacher);
        const assignedLevelNames = teacher.level.split(', ').filter(Boolean);
        const assignedLevels = levels.filter(l => assignedLevelNames.includes(l.name));
        setSelectedLevels(assignedLevels);
        setIsDialogOpen(true);
    };
    
    const confirmDelete = (teacher: Teacher) => {
        setTeacherToDelete(teacher);
        setIsDeleteAlertOpen(true);
    };

    const handleDeleteClick = async () => {
        if (!teacherToDelete) return;
        
        const students = await getStudents();
        const studentsToUpdate = students.filter(s => s.teacher === teacherToDelete.name);

        for (const student of studentsToUpdate) {
            await updateStudent(student.id, { teacher: 'Unassigned' });
        }
        
        await deleteTeacher(teacherToDelete.id);

        setIsDeleteAlertOpen(false);
        setTeacherToDelete(null);
        await fetchData();
        toast({ title: "Teacher Deleted", description: `${teacherToDelete.name} has been removed.` });
    };

    const handleManageClassClick = (teacher: Teacher) => {
        sessionStorage.setItem('currentTeacher', JSON.stringify(teacher));
        router.push('/teacher');
    };

    const handleSaveChanges = async () => {
        if (!currentTeacher) return;

        const levelNames = selectedLevels.map(l => l.name).join(', ');

        try {
            if (currentTeacher.id) {
                // Edit existing teacher
                const originalTeacher = teachers.find(t => t.id === currentTeacher.id);
                
                await updateTeacher(currentTeacher.id, { ...currentTeacher, level: levelNames });

                if (originalTeacher && originalTeacher.name !== currentTeacher.name) {
                    const students = await getStudents();
                    const studentsToUpdate = students.filter(s => s.teacher === originalTeacher.name);
                     for (const student of studentsToUpdate) {
                        await updateStudent(student.id, { teacher: currentTeacher.name });
                    }
                }

            } else {
                // Add new teacher
                const newTeacherData: Omit<Teacher, 'id'> = { 
                    name: currentTeacher.name || '', 
                    username: currentTeacher.username || (currentTeacher.name || '').toLowerCase().replace(' ', ''),
                    password: currentTeacher.password || 'password',
                    level: levelNames, 
                    students: currentTeacher.students || 0 
                };
                await addTeacher(newTeacherData);
            }

            await fetchData();
            setIsDialogOpen(false);
            setCurrentTeacher(null);
            setSelectedLevels([]);
            toast({ title: "Success", description: "Teacher data saved." });

        } catch (error) {
             console.error("Failed to save teacher", error);
             toast({ variant: "destructive", title: "Error", description: "Could not save teacher data." });
        }
    };
    
    const handleDialogClose = () => {
      setIsDialogOpen(false);
      setCurrentTeacher(null);
      setSelectedLevels([]);
    }

    const toggleLevelSelection = (level: Level) => {
        setSelectedLevels(prev => 
            prev.some(l => l.id === level.id)
                ? prev.filter(l => l.id !== level.id)
                : [...prev, level]
        );
    }
    
    const removeLevel = (levelId: string) => {
        setSelectedLevels(prev => prev.filter(l => l.id !== levelId));
    };


    return (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <Card>
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <CardTitle>Teachers</CardTitle>
                    <Button size="sm" onClick={handleAddClick}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Teacher
                    </Button>
                </CardHeader>
                <CardContent>
                   <div className="overflow-x-auto border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Assigned Level</TableHead>
                                    <TableHead>Students</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teachers.map(teacher => (
                                    <TableRow key={teacher.id}>
                                        <TableCell className="font-medium">{teacher.name}</TableCell>
                                        <TableCell>{teacher.username}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {teacher.level.split(',').map(l => l.trim()).filter(Boolean).map(level => (
                                                    <Badge key={level} variant="outline">{level}</Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>{teacher.students}</TableCell>
                                        <TableCell className="text-right space-x-2 whitespace-nowrap">
                                             <Button variant="outline" size="sm" onClick={() => handleManageClassClick(teacher)}>
                                                <UserCog className="mr-2 h-4 w-4" />
                                                Manage Class
                                            </Button>
                                            <Button variant="outline" size="icon" onClick={() => handleEditClick(teacher)}>
                                                <Edit className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Button>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="icon" onClick={() => confirmDelete(teacher)}>
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </AlertDialogTrigger>
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
                        <DialogTitle>{currentTeacher?.id ? 'Edit Teacher' : 'Add New Teacher'}</DialogTitle>
                        <DialogDescription>
                            {currentTeacher?.id ? 'Make changes to the teacher details here.' : 'Enter the details for the new teacher.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={currentTeacher?.name || ''}
                                onChange={(e) => setCurrentTeacher({ ...currentTeacher, name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="username" className="text-right">
                                Username
                            </Label>
                            <Input
                                id="username"
                                value={currentTeacher?.username || ''}
                                onChange={(e) => setCurrentTeacher({ ...currentTeacher, username: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Unchanged if blank"
                                onChange={(e) => setCurrentTeacher({ ...currentTeacher, password: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                         <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="level" className="text-right pt-2">
                                Level(s)
                            </Label>
                            <div className="col-span-3">
                                <Popover open={isLevelPickerOpen} onOpenChange={setLevelPickerOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={isLevelPickerOpen}
                                            className="w-full justify-between"
                                        >
                                            {selectedLevels.length > 0
                                                ? `${selectedLevels.length} level(s) selected`
                                                : "Select levels..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search levels..." />
                                            <CommandList>
                                                <CommandEmpty>No levels found.</CommandEmpty>
                                                <CommandGroup>
                                                    {levels.map((level) => (
                                                        <CommandItem
                                                            key={level.id}
                                                            value={level.name}
                                                            onSelect={() => {
                                                                toggleLevelSelection(level);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedLevels.some(l => l.id === level.id) ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {level.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {selectedLevels.map(level => (
                                        <Badge key={level.id} variant="secondary">
                                            {level.name}
                                            <button
                                                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                onClick={() => removeLevel(level.id)}
                                            >
                                                <XIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="students" className="text-right">
                                Students
                            </Label>
                            <Input
                                id="students"
                                type="number"
                                value={currentTeacher?.students || ''}
                                onChange={(e) => setCurrentTeacher({ ...currentTeacher, students: parseInt(e.target.value, 10) || 0 })}
                                className="col-span-3"
                                disabled
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
                        <Button onClick={handleSaveChanges}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this teacher?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the teacher account for <span className="font-bold">{teacherToDelete?.name}</span> and unassign all their students.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteClick}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}