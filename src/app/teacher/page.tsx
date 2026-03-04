/**
 * @file src/app/teacher/page.tsx
 * @fileoverview The main gradebook page for the Teacher role. Corresponds to the "/teacher" route.
 * This is the core page for teachers, allowing them to manage a dynamic gradebook for their assigned class,
 * enter grades, set final grades, toggle visibility, and add AI-assisted feedback.
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type Teacher, type Feedback, type Grade, type Student, type AssignmentGrade, type HistoricalGrade } from '@/lib/data';
import { 
    getStudents, getGradesByTeacher, getFeedbackForStudent, setGrade, setHistoricalGrade, addFeedback
} from '@/lib/firebase-actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CommentAnalyzer } from '@/components/comment-analyzer';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type StudentGradeData = Student & {
    grades: Record<string, number | string>;
    feedback: Feedback[];
    finalGrade: string; // The manual final grade
    gradeVisible: boolean;
};

type Column = {
    id: string;
    title: string;
    points: number;
};


export default function TeacherPage() {
  const [studentsData, setStudentsData] = useState<StudentGradeData[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [cumulativeGrades, setCumulativeGrades] = useState<Record<string, { text: string; percentage: number | null }>>({});
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [minPassingGrade, setMinPassingGrade] = useState(70);

  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [selectedStudentForFeedback, setSelectedStudentForFeedback] = useState<StudentGradeData | null>(null);
  const [newFeedback, setNewFeedback] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    const teacherJson = sessionStorage.getItem('currentTeacher');
    const teacher = teacherJson ? JSON.parse(teacherJson) : null;
    setCurrentTeacher(teacher);

    if (teacher) {
        fetchData(teacher);
    }
  }, []);

  const fetchData = async (teacher: Teacher) => {
    // A simple heuristic to populate columns from existing grade structures if not set
    const gradesForTeacher = await getGradesByTeacher(teacher.name);
    const sampleGradeForColumns = gradesForTeacher.find(g => g.level === teacher.level);

    let initialColumns: Column[] = [];
    if (sampleGradeForColumns && sampleGradeForColumns.assignmentGrades.length > 0) {
            initialColumns = sampleGradeForColumns.assignmentGrades.map((ag, index) => ({
            id: `col_${ag.title.replace(/\s+/g, '_')}_${index}`,
            title: ag.title,
            points: ag.points || 100
            }));
    } else {
            initialColumns = [{ id: `col_${Date.now()}_1`, title: 'Assignment 1', points: 100 }];
    }
    setColumns(initialColumns);

    const allStudents = await getStudents();
    const teacherStudents = allStudents
        .filter(s => s.teacher === teacher.name)
        .map(async s => {
            const studentGrade = gradesForTeacher.find(g => g.studentId === s.studentId && g.level === teacher.level);
            const studentFeedback = await getFeedbackForStudent(s.id);
            const studentAssignments = studentGrade?.assignmentGrades || [];
            const grades: Record<string, number | string> = {};
            
            initialColumns.forEach(col => {
                const savedAssignment = studentAssignments.find(ag => ag.title === col.title);
                grades[col.id] = savedAssignment?.grade ?? '';
            });

            const studentData: StudentGradeData = {
                ...s,
                grades,
                feedback: studentFeedback.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [],
                finalGrade: studentGrade?.grade || '',
                gradeVisible: studentGrade?.visible ?? false,
            };
            
            return studentData;
        });
        
    setStudentsData(await Promise.all(teacherStudents));
  }

  useEffect(() => {
    calculateAllCumulativeGrades();
  }, [studentsData, columns, minPassingGrade]);

 const calculateAllCumulativeGrades = () => {
    const newCumulativeGrades: Record<string, { text: string; percentage: number | null }> = {};

    studentsData.forEach(student => {
        let earnedPoints = 0;
        let totalPossiblePoints = 0;

        columns.forEach(col => {
            const grade = student.grades[col.id];
            const gradeAsNum = parseFloat(String(grade)); // Use String() to handle numbers
            const points = col.points || 0;

            if (!isNaN(gradeAsNum)) {
                earnedPoints += gradeAsNum;
            }
            // Always include points in total, unless the grade is non-numeric text (like 'EX' for exempt)
            if (String(grade).trim() === '' || !isNaN(gradeAsNum)) {
                 totalPossiblePoints += points;
            }
        });
        
        if (totalPossiblePoints > 0) {
            const percentage = (earnedPoints / totalPossiblePoints) * 100;
            newCumulativeGrades[student.id] = {
                text: `${earnedPoints} / ${totalPossiblePoints}`,
                percentage: percentage
            };
        } else {
            newCumulativeGrades[student.id] = { text: '', percentage: null };
        }
    });
    setCumulativeGrades(newCumulativeGrades);
  };
  
  const handleAddColumn = () => {
    const newColumnId = `col_${Date.now()}`;
    const newColumn: Column = {
      id: newColumnId,
      title: `New Assignment`,
      points: 100,
    };
    setColumns([...columns, newColumn]);
    // Initialize grades for this new column for all students
    setStudentsData(prevStudents => prevStudents.map(s => ({
        ...s,
        grades: { ...s.grades, [newColumnId]: '' }
    })));
  };

  const handleColumnTitleChange = (id: string, newTitle: string) => {
    setColumns(columns.map(col => col.id === id ? { ...col, title: newTitle } : col));
  };
   
  const handleColumnPointsChange = (id: string, points: string) => {
    const numPoints = parseInt(points, 10);
    setColumns(columns.map(col => col.id === id ? { ...col, points: isNaN(numPoints) ? 0 : numPoints } : col));
  }
  
  const handleRemoveColumn = (id: string) => {
    setColumns(columns.filter(col => col.id !== id));
    setStudentsData(studentsData.map(student => {
        const newGrades = {...student.grades};
        delete newGrades[id];
        return {...student, grades: newGrades};
    }));
  };
  
  const handleGradeChange = (studentId: string, colId: string, grade: string) => {
    setStudentsData(studentsData.map(s => s.id === studentId ? { ...s, grades: { ...s.grades, [colId]: grade } } : s));
  };

  const handleOpenFeedbackDialog = (student: StudentGradeData) => {
    setSelectedStudentForFeedback(student);
    setIsFeedbackDialogOpen(true);
  };

  const handleAddFeedback = async () => {
    if (!newFeedback.trim() || !selectedStudentForFeedback) return;
    
    const feedbackEntry: Omit<Feedback, 'id'> = {
        studentId: selectedStudentForFeedback.id,
        date: new Date().toISOString(),
        comment: newFeedback.trim()
    };

    const newFeedbackId = await addFeedback(feedbackEntry);
    const newFeedbackWithId = {...feedbackEntry, id: newFeedbackId} as Feedback;
    
    const updatedStudents = studentsData.map(s => 
        s.id === selectedStudentForFeedback.id 
        ? { ...s, feedback: [newFeedbackWithId, ...s.feedback] } 
        : s
    );
    setStudentsData(updatedStudents);

    setNewFeedback('');
  };

  const handleVisibilityChange = (studentId: string, visible: boolean) => {
    setStudentsData(studentsData.map(s => s.id === studentId ? { ...s, gradeVisible: visible } : s));
  };

  const handleFinalGradeChange = (studentId: string, grade: string) => {
     setStudentsData(studentsData.map(s => s.id === studentId ? { ...s, finalGrade: grade } : s));
  };
  
  const handleSaveChanges = async () => {
    if (!currentTeacher) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not find teacher information.'});
        return;
    }

    for (const student of studentsData) {
        const gradeId = `${student.studentId}-${currentTeacher.level}`;
        const assignmentGrades: AssignmentGrade[] = columns.map(col => ({
            title: col.title,
            grade: student.grades[col.id] || 'N/A',
            points: col.points
        }));

        const gradeData: Grade = {
            id: gradeId,
            studentId: student.studentId,
            level: currentTeacher.level,
            teacher: currentTeacher.name,
            grade: student.finalGrade,
            comment: '', // Final comment is handled via feedback dialog now
            visible: student.gradeVisible,
            assignmentGrades: assignmentGrades
        };
        await setGrade(gradeData);
    }
    
    // Create or update the historical record for this level
    const historicalRecord: HistoricalGrade = {
        id: currentTeacher.level, // Use level name as the unique ID
        lastSaved: new Date().toISOString(),
        levelName: currentTeacher.level,
        teacherName: currentTeacher.name,
        columns: columns,
        studentData: studentsData.map(s => ({
            studentId: s.studentId,
            studentName: s.name,
            grades: s.grades,
            finalGrade: s.finalGrade
        }))
    };
    await setHistoricalGrade(historicalRecord);


    toast({
        title: 'Gradebook Saved',
        description: 'All changes have been saved and the historical record has been updated.',
    });
  };
  
  if (!currentTeacher) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Please log in to view your class.</p>
                 <Button asChild className="mt-4"><Link href="/">Go to Login</Link></Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <>
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div>
                            <CardTitle>{currentTeacher.level} Gradebook</CardTitle>
                            <CardDescription>Enter grades and feedback for your students. Add or remove columns as needed.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="passingGrade" className="whitespace-nowrap">Min. Passing Grade (%)</Label>
                            <Input
                                id="passingGrade"
                                type="number"
                                value={minPassingGrade}
                                onChange={(e) => setMinPassingGrade(parseInt(e.target.value, 10) || 0)}
                                className="w-24"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto border rounded-lg">
                        <Table className="whitespace-nowrap">
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead className="w-[200px] sticky left-0 bg-muted/50 z-10 font-bold text-center border-r">Student</TableHead>
                                    <TableHead className="w-[150px] font-bold text-center border-r">Cumulative Grade</TableHead>
                                    <TableHead className="w-[150px] font-bold text-center border-r">Final Grade</TableHead>
                                    {columns.map(col => (
                                        <TableHead key={col.id} className="min-w-[200px] border-r p-2 align-top">
                                            <div className="flex flex-col items-center gap-1 justify-center">
                                                <Input 
                                                    value={col.title} 
                                                    onChange={(e) => handleColumnTitleChange(col.id, e.target.value)}
                                                    onBlur={calculateAllCumulativeGrades}
                                                    className="w-full h-8 text-sm font-bold text-center bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-ring"
                                                    placeholder="Assignment Title"
                                                />
                                                <div className="flex items-center gap-1 w-full">
                                                    <Input
                                                        type="number"
                                                        value={col.points || ''}
                                                        onChange={(e) => handleColumnPointsChange(col.id, e.target.value)}
                                                        onBlur={calculateAllCumulativeGrades}
                                                        className="w-20 h-7 text-xs text-center mx-auto"
                                                        placeholder="Points"
                                                    />
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleRemoveColumn(col.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </TableHead>
                                    ))}
                                    <TableHead className="w-[100px] text-center border-r">
                                        <Button size="sm" variant="outline" onClick={handleAddColumn}>
                                            <PlusCircle className="h-4 w-4 mr-2" />
                                            Add
                                        </Button>
                                    </TableHead>
                                    <TableHead className="w-[150px] font-bold text-center">Feedback</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentsData.map(student => {
                                    const cumulative = cumulativeGrades[student.id];
                                    const isFailing = cumulative && cumulative.percentage !== null && cumulative.percentage < minPassingGrade;
                                    const isDropped = student.dropped;

                                    return (
                                        <TableRow key={student.id} className={cn("odd:bg-muted/20", isDropped && "bg-slate-100 dark:bg-slate-800/50")}>
                                            <TableCell className={cn("font-medium sticky left-0 bg-[inherit] z-10 border-r", isDropped && "line-through text-muted-foreground")}>
                                                <div className="flex items-center gap-2">
                                                    {student.name}
                                                    {isDropped && <Badge variant="destructive">Dropped</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className={cn(
                                                "font-bold text-lg text-center border-r",
                                                isFailing && "text-destructive"
                                            )}>
                                                {cumulative?.text || ''}
                                            </TableCell>
                                            <TableCell className="border-r">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Input
                                                        className="w-24 h-9 text-center"
                                                        placeholder="N/A"
                                                        value={student.finalGrade || ''}
                                                        onChange={(e) => handleFinalGradeChange(student.id, e.target.value)}
                                                        disabled={isDropped}
                                                    />
                                                     <Switch
                                                        id={`visibility-${student.id}`}
                                                        checked={student.gradeVisible}
                                                        onCheckedChange={(checked) => handleVisibilityChange(student.id, checked)}
                                                        aria-label="Toggle grade visibility"
                                                        disabled={isDropped}
                                                    />
                                                </div>
                                            </TableCell>
                                            {columns.map(col => (
                                                <TableCell key={col.id} className="text-center border-r">
                                                    <Input
                                                        type="text"
                                                        className="w-24 h-9 text-center mx-auto"
                                                        placeholder="N/A"
                                                        value={student.grades[col.id] || ''}
                                                        onChange={(e) => handleGradeChange(student.id, col.id, e.target.value)}
                                                        onBlur={calculateAllCumulativeGrades}
                                                        disabled={isDropped}
                                                    />
                                                </TableCell>
                                            ))}
                                            <TableCell className="border-r"></TableCell>
                                            <TableCell className="text-center">
                                                <Button variant="outline" size="sm" onClick={() => handleOpenFeedbackDialog(student)}>
                                                    <MessageSquare className="h-4 w-4 mr-2"/>
                                                    Feedback ({student.feedback.length})
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button size="lg" onClick={handleSaveChanges}>Save All Changes</Button>
            </div>
        </div>

        <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>Feedback for {selectedStudentForFeedback?.name}</DialogTitle>
                    <DialogDescription>
                        View past feedback and add new comments. Each entry is dated.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <ScrollArea className="h-64 pr-4">
                        {selectedStudentForFeedback?.feedback.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No feedback yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {selectedStudentForFeedback?.feedback.map((fb, index) => (
                                    <div key={index}>
                                        <p className="text-xs font-semibold text-muted-foreground">{format(new Date(fb.date), "PPP p")}</p>

                                        <p className="text-sm p-3 bg-secondary rounded-md mt-1">{fb.comment}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                    <Separator />
                    <div>
                         <div className="flex items-start gap-2">
                             <Textarea 
                                placeholder="Type your new feedback here..."
                                value={newFeedback}
                                onChange={(e) => setNewFeedback(e.target.value)}
                                rows={3}
                                className="flex-1"
                            />
                            <CommentAnalyzer comment={newFeedback} onCommentUpdate={setNewFeedback} />
                        </div>
                        <Button onClick={handleAddFeedback} className="mt-2" disabled={!newFeedback.trim()}>
                            Add New Feedback
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsFeedbackDialogOpen(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}