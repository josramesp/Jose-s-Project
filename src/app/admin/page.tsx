/**
 * @file src/app/admin/page.tsx
 * @fileoverview The main dashboard for the Admin role. Corresponds to the "/admin" route.
 * It features a menu to switch between different reports: Student Distribution, Final Grades, Performance, and Historical Gradebooks.
 */
'use client';

import { useEffect, useState } from 'react';
import * as xlsx from 'xlsx';
import { saveAs } from 'file-saver';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, GraduationCap, BookCopy, BarChart, ChevronRight, History, Download, Trash2 } from 'lucide-react';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { type Grade, type Student, type Teacher, type Level, type HistoricalGrade } from '@/lib/data';
import { getStudents, getTeachers, getLevels, getGrades, getHistoricalGrades, deleteHistoricalGrade } from '@/lib/firebase-actions';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
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


// Config for Student Distribution Chart
const chartConfig = {
  students: {
    label: 'Students',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

// Types for Performance Reports
type ReportData = {
    levelName: string;
    topPerformers: { studentName: string; finalGrade: string }[];
    belowPassing: { studentName: string; finalGrade: string }[];
};
const MIN_PASSING_GRADE = 70;


// Components for each report view
const StudentDistributionReport = () => {
    const [summaryData, setSummaryData] = useState([
        { title: 'Total Students', value: '0', icon: GraduationCap },
        { title: 'Total Teachers', value: '0', icon: Users },
        { title: 'Levels', value: '0', icon: BookCopy },
    ]);

    const [studentDistributionData, setStudentDistributionData] = <{level: string; students: number}[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const students = await getStudents();
            const teachers = await getTeachers();
            const levels = await getLevels();

            const totalStudents = students.length;
            const totalTeachers = teachers.length;
            const totalLevels = levels.length;

            setSummaryData([
                { title: 'Total Students', value: String(totalStudents), icon: GraduationCap },
                { title: 'Total Teachers', value: String(totalTeachers), icon: Users },
                { title: 'Levels', value: String(totalLevels), icon: BookCopy },
            ]);

            const distribution: Record<string, number> = {};
            students.forEach(student => {
                if (student.level) {
                    distribution[student.level] = (distribution[student.level] || 0) + 1;
                }
            });

            const chartData = Object.entries(distribution).map(([level, students]) => ({
                level,
                students,
            }));
            setStudentDistributionData(chartData);
        }
        fetchData();
    }, []);

    return (
        <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {summaryData.map((item) => (
                <Card key={item.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{item.value}</div>
                    </CardContent>
                </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart className="h-5 w-5" />
                    Student Distribution per Level
                </CardTitle>
                </CardHeader>
                <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                    <RechartsBarChart data={studentDistributionData} accessibilityLayer>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="level"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 12)}
                    />
                    <YAxis />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="students" fill="var(--color-students)" radius={4} />
                    </RechartsBarChart>
                </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
};

const FinalGradesReport = () => {
    const [gradesByLevel, setGradesByLevel] = useState<Record<string, { studentName: string; finalGrade: string }[]>>({});

    useEffect(() => {
        const fetchData = async () => {
            const allLevels = await getLevels();
            const allGrades = await getGrades();
            const allStudents = await getStudents();

            const groupedGrades: Record<string, { studentName: string; finalGrade: string }[]> = {};

            allLevels.forEach(level => {
                const levelGrades = allGrades
                    .filter(g => g.level === level.name && g.visible && g.grade)
                    .map(grade => {
                        const student = allStudents.find(s => s.studentId === grade.studentId);
                        return {
                            studentName: student?.name || 'Unknown Student',
                            finalGrade: grade.grade,
                        };
                    });
                groupedGrades[level.name] = levelGrades;
            });

            setGradesByLevel(groupedGrades);
        }
        fetchData();
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Final Grades by Level</CardTitle>
                <CardDescription>
                    A comprehensive list of all student final grades, organized by level.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8">
                {Object.entries(gradesByLevel).map(([levelName, grades]) => (
                    <div key={levelName}>
                        <h3 className="text-xl font-bold mb-4 tracking-tight">{levelName}</h3>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student Name</TableHead>
                                        <TableHead className="w-[120px] text-right">Final Grade</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {grades.length > 0 ? (
                                        grades.map((student, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{student.studentName}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="secondary">{student.finalGrade}</Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                                                No final grades available for this level.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};


const PerformanceReport = () => {
    const [reportsData, setReportsData] = useState<ReportData[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const allLevels = await getLevels();
            const allGrades = await getGrades();
            const allStudents = await getStudents();

            const generatedReports: ReportData[] = allLevels.map(level => {
                const levelGrades = allGrades.filter(g => g.level === level.name && g.visible && g.grade);
                
                const studentsWithGrades = levelGrades.map(grade => {
                    const student = allStudents.find(s => s.studentId === grade.studentId);
                    return {
                        studentName: student?.name || 'Unknown Student',
                        finalGrade: grade.grade,
                        gradeValue: parseFloat(grade.grade)
                    };
                }).filter(s => !isNaN(s.gradeValue));


                const sortedStudents = [...studentsWithGrades].sort((a, b) => b.gradeValue - a.gradeValue);
                
                const topPerformers = sortedStudents.slice(0, 5);
                const belowPassing = sortedStudents.filter(s => s.gradeValue < MIN_PASSING_GRADE);

                return {
                    levelName: level.name,
                    topPerformers,
                    belowPassing,
                };
            });
            setReportsData(generatedReports);
        }
        fetchData();
    }, []);

     return (
        <Card>
            <CardHeader>
                <CardTitle>Performance Reports</CardTitle>
                <CardDescription>
                    A summary of student performance by level, highlighting top performers and students needing support.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8">
                {reportsData.map((report) => (
                    <div key={report.levelName}>
                        <h3 className="text-xl font-bold mb-4 tracking-tight">{report.levelName}</h3>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-semibold mb-2">Top 5 Students</h4>
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Student Name</TableHead>
                                                <TableHead className="w-[120px] text-right">Final Grade</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {report.topPerformers.length > 0 ? (
                                                report.topPerformers.map((student, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{student.studentName}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Badge variant="default">{student.finalGrade}</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                                                        No grade data available.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Students Below Passing (&lt; {MIN_PASSING_GRADE})</h4>
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Student Name</TableHead>
                                                <TableHead className="w-[120px] text-right">Final Grade</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                             {report.belowPassing.length > 0 ? (
                                                report.belowPassing.map((student, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{student.studentName}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Badge variant="destructive">{student.finalGrade}</Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                             ) : (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                                                        All students are passing.
                                                    </TableCell>
                                                </TableRow>
                                             )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

const HistoricalReport = () => {
    const [historicalData, setHistoricalData] = useState<HistoricalGrade[]>([]);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<HistoricalGrade | null>(null);


    useEffect(() => {
        refreshData();
    }, []);
    
    const refreshData = async () => {
        const data = await getHistoricalGrades();
        const sortedData = data.sort((a, b) => new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime());
        setHistoricalData(sortedData);
    };

    const confirmDelete = (record: HistoricalGrade) => {
        setRecordToDelete(record);
        setIsDeleteAlertOpen(true);
    };

    const handleDeleteRecord = async () => {
        if (!recordToDelete) return;
        
        await deleteHistoricalGrade(recordToDelete.id);
        await refreshData();

        setIsDeleteAlertOpen(false);
        setRecordToDelete(null);
    };

    const handleExportHistoricalData = () => {
        const wb = xlsx.utils.book_new();

        historicalData.forEach(record => {
            const sheetName = `${record.levelName.replace(/[\/\\?*\[\]]/g, '')}_${format(new Date(record.lastSaved), "yyyy-MM-dd")}`.slice(0, 31);
            
            const headers = ['Student Name', 'Final Grade', ...record.columns.map(col => `${col.title} (${col.points} pts)`)];
            const data = record.studentData.map(student => {
                const row: (string | number)[] = [student.studentName, student.finalGrade];
                record.columns.forEach(col => {
                    row.push(student.grades[col.id] || '');
                });
                return row;
            });
            
            const wsData = [headers, ...data];
            const ws = xlsx.utils.aoa_to_sheet(wsData);
            xlsx.utils.book_append_sheet(wb, ws, sheetName);
        });

        const wbout = xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'HistoricalGradebooks.xlsx');
    };

    if (historicalData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Historical Gradebooks</CardTitle>
                    <CardDescription>
                        Read-only snapshots of gradebooks from when they were last saved by teachers.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center gap-4 p-8">
                     <div className="p-4 bg-muted rounded-full">
                        <History className="h-8 w-8 text-muted-foreground" />
                     </div>
                     <p className="text-sm font-medium">No historical gradebook records found.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Historical Gradebooks</CardTitle>
                            <CardDescription>
                                Read-only snapshots of gradebooks. Export backups and delete old records to free up space.
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleExportHistoricalData}>
                            <Download className="mr-2 h-4 w-4" />
                            Export All to Excel
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {historicalData.map(record => (
                            <AccordionItem key={record.id} value={record.id}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-4 w-full">
                                        <History className="h-5 w-5" />
                                        <div className="flex-1 text-left">
                                            <span className="font-bold">{record.levelName}</span>
                                            <p className="text-sm text-muted-foreground">
                                                Last saved by {record.teacherName} on {format(new Date(record.lastSaved), "PPP p")}
                                            </p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="flex justify-end mb-2">
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm" onClick={() => confirmDelete(record)}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete This Record
                                            </Button>
                                        </AlertDialogTrigger>
                                    </div>
                                    <div className="overflow-x-auto border rounded-lg">
                                        <Table className="whitespace-nowrap">
                                            <TableHeader>
                                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                                    <TableHead className="w-[200px] font-bold border-r">Student</TableHead>
                                                    <TableHead className="w-[150px] font-bold text-center border-r">Final Grade</TableHead>
                                                    {record.columns.map(col => (
                                                        <TableHead key={col.id} className="min-w-[150px] border-r text-center font-bold">
                                                            {col.title} ({col.points} pts)
                                                        </TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {record.studentData.map(student => (
                                                    <TableRow key={student.studentId} className="odd:bg-muted/20">
                                                        <TableCell className="font-medium border-r">{student.studentName}</TableCell>
                                                        <TableCell className="font-semibold text-lg text-center border-r">{student.finalGrade || 'N/A'}</TableCell>
                                                        {record.columns.map(col => (
                                                            <TableCell key={col.id} className="text-center border-r">
                                                                {String(student.grades[col.id]) || '-'}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the historical grade record for <span className="font-bold">{recordToDelete?.levelName}</span> saved on <span className="font-bold">{recordToDelete ? format(new Date(recordToDelete.lastSaved), "PPP") : ''}</span>. 
                    <br/><br/>
                    It is highly recommended to export the data before deleting.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteRecord}>Yes, Delete Record</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};


const reportViews: Record<string, React.FC> = {
    'distribution': StudentDistributionReport,
    'finalGrades': FinalGradesReport,
    'performance': PerformanceReport,
    'historical': HistoricalReport,
};

const reportMenu = [
    { id: 'distribution', label: 'Student Distribution' },
    { id: 'finalGrades', label: 'Final Grades by Level' },
    { id: 'performance', label: 'Performance Reports' },
    { id: 'historical', label: 'Historical' },
];


export default function AdminDashboardPage() {
    const [activeReport, setActiveReport] = useState('distribution');
    const ActiveReportComponent = reportViews[activeReport];

    return (
        <div className="grid md:grid-cols-[240px_1fr] gap-8 items-start">
            <nav className="flex flex-col gap-2 sticky top-6">
                <h3 className="font-semibold text-lg">Reports Menu</h3>
                {reportMenu.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveReport(item.id)}
                        className={cn(
                            "flex justify-between items-center text-left text-sm p-2 rounded-md hover:bg-muted",
                            activeReport === item.id && "bg-muted font-semibold"
                        )}
                    >
                        {item.label}
                        <ChevronRight className="h-4 w-4" />
                    </button>
                ))}
            </nav>
            <div>
                {ActiveReportComponent && <ActiveReportComponent />}
            </div>
        </div>
    );
}