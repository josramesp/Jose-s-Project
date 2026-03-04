/**
 * @file src/app/admin/levels/page.tsx
 * @fileoverview Admin level management page. Corresponds to the "/admin/levels" route.
 * Allows admins to create, read, update, and delete academic levels, and assign students and teachers to them.
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, PlusCircle, ChevronsUpDown, Check, XIcon, Printer } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
import { type Level, type Student } from '@/lib/data';
import { getLevels, getStudents, addLevel, updateLevel, deleteLevel } from '@/lib/firebase-actions';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


export default function LevelsPage() {
    const [levels, setLevels] = useState<Level[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentLevel, setCurrentLevel] = useState<Partial<Level> | null>(null);
    const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
    const [isStudentPickerOpen, setStudentPickerOpen] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);
    
    const fetchData = async () => {
        const levelList = await getLevels();
        const studentList = await getStudents();
        setLevels(levelList);
        setStudents(studentList);
    };

    const handleAddClick = () => {
        setCurrentLevel({});
        setSelectedStudents([]);
        setIsDialogOpen(true);
    };

    const handleEditClick = (level: Level) => {
        setCurrentLevel(level);
        const studentNames = level.students.split(', ').filter(Boolean);
        const studentsInLevel = students.filter(s => studentNames.includes(s.name));
        setSelectedStudents(studentsInLevel);
        setIsDialogOpen(true);
    };
    
    const handleDeleteClick = async (levelId: string) => {
        await deleteLevel(levelId);
        await fetchData();
        toast({ title: "Level Deleted", description: "The level has been removed." });
    };

    const handlePrint = (level: Level) => {
        if (printRef.current) {
            const studentNames = level.students.split(', ').filter(Boolean);
            const levelName = level.name;

            const printContent = `
                <html>
                    <head>
                        <title>Student List - ${levelName}</title>
                        <style>
                            @media print {
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                h1 { font-size: 1.5em; text-align: center; margin-bottom: 20px; }
                                ul { list-style-type: none; padding: 0; }
                                li { padding: 8px; border-bottom: 1px solid #ccc; }
                                @page { size: auto; margin: 20mm; }
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Student List: ${levelName}</h1>
                        <ul>
                            ${studentNames.map(name => `<li>${name}</li>`).join('')}
                        </ul>
                    </body>
                </html>
            `;
            
            const printWindow = window.open('', '_blank');
            printWindow?.document.write(printContent);
            printWindow?.document.close();
            printWindow?.focus();
            printWindow?.print();
        }
    };

    const handleSaveChanges = async () => {
        if (!currentLevel) return;
        
        const studentNames = selectedStudents.map(s => s.name).join(', ');
        
        const levelData = {
            ...currentLevel,
            students: studentNames
        };

        try {
            if (currentLevel.id) {
                await updateLevel(currentLevel.id, levelData);
            } else {
                const newLevelData: Omit<Level, 'id'> = {
                    name: currentLevel.name || '',
                    teachers: currentLevel.teachers || '',
                    students: studentNames
                };
                await addLevel(newLevelData);
            }
            await fetchData();
            setIsDialogOpen(false);
            setCurrentLevel(null);
            setSelectedStudents([]);
            toast({ title: "Success", description: "Level data saved." });
        } catch (error) {
            console.error("Failed to save level", error);
            toast({ variant: "destructive", title: "Error", description: "Could not save level data." });
        }
    };

    const handleDialogClose = () => {
      setIsDialogOpen(false);
      setCurrentLevel(null);
      setSelectedStudents([]);
    }

    const toggleStudentSelection = (student: Student) => {
        setSelectedStudents(prev => 
            prev.some(s => s.id === student.id)
                ? prev.filter(s => s.id !== student.id)
                : [...prev, student]
        );
    }
    
    const removeStudent = (studentId: string) => {
        setSelectedStudents(prev => prev.filter(s => s.id !== studentId));
    };


    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Levels</CardTitle>
                    <Button size="sm" onClick={handleAddClick}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Level
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Level Name</TableHead>
                                <TableHead>Teachers Assigned</TableHead>
                                <TableHead>Students Enrolled</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {levels.map(level => (
                                <TableRow key={level.id}>
                                    <TableCell className="font-medium">{level.name}</TableCell>
                                    <TableCell>{level.teachers}</TableCell>
                                    <TableCell>
                                        <ScrollArea className="w-64 whitespace-nowrap rounded-md">
                                            <div className="flex w-max space-x-2 p-1">
                                                {level.students.split(', ').filter(Boolean).map((student, index) => (
                                                    <Badge key={index} variant="secondary" className="py-1">
                                                        {student}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <ScrollBar orientation="horizontal" />
                                        </ScrollArea>
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
                                                <DropdownMenuItem onClick={() => handleEditClick(level)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handlePrint(level)}>
                                                    <Printer className="mr-2 h-4 w-4" />
                                                    Print Student List
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteClick(level.id)}>Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{currentLevel?.id ? 'Edit Level' : 'Add New Level'}</DialogTitle>
                        <DialogDescription>
                            {currentLevel?.id ? 'Make changes to the level details here.' : 'Enter the details for the new level.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={currentLevel?.name || ''}
                                onChange={(e) => setCurrentLevel({ ...currentLevel, name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="teachers" className="text-right">
                                Teachers
                            </Label>
                            <Input
                                id="teachers"
                                value={currentLevel?.teachers || ''}
                                onChange={(e) => setCurrentLevel({ ...currentLevel, teachers: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="students" className="text-right pt-2">
                                Students
                            </Label>
                           <div className="col-span-3">
                                <Popover open={isStudentPickerOpen} onOpenChange={setStudentPickerOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={isStudentPickerOpen}
                                            className="w-full justify-between"
                                        >
                                            {selectedStudents.length > 0
                                                ? `${selectedStudents.length} student(s) selected`
                                                : "Select students..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[300px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search students..." />
                                            <CommandList>
                                                <CommandEmpty>No students found.</CommandEmpty>
                                                <CommandGroup>
                                                    {students.map((student) => (
                                                        <CommandItem
                                                            key={student.id}
                                                            value={student.name}
                                                            onSelect={() => {
                                                                toggleStudentSelection(student);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedStudents.some(s => s.id === student.id) ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            {student.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {selectedStudents.map(student => (
                                        <Badge key={student.id} variant="secondary">
                                            {student.name}
                                            <button
                                                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                                onClick={() => removeStudent(student.id)}
                                            >
                                                <XIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
                        <Button onClick={handleSaveChanges}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
             <div ref={printRef} className="hidden" />
        </>
    );
}