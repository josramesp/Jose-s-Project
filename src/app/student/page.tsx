/**
 * @file src/app/student/page.tsx
 * @fileoverview The main dashboard for the Student role. Corresponds to the "/student" route.
 * This page fetches and displays the student's final grades, individual assignment scores,
 * and all feedback from their teacher. It also includes a language toggle.
 */
'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FileDown, EyeOff, BookOpenCheck, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type Grade, type Student, type Feedback } from '@/lib/data';
import { getGradesByStudentId, getFeedbackForStudent } from '@/lib/firebase-actions';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


type GradeInfo = Grade & {
    feedbacks: Feedback[];
};

const translations = {
    en: {
        myFinalGrades: "My Final Grades",
        resultsDescription: "Here are your final results for the recent term.",
        downloadPdf: "Download PDF",
        teacher: "Teacher",
        finalGrade: "Final Grade",
        notReadyYet: "Not ready yet",
        assignmentGrades: "Assignment Grades",
        assignment: "Assignment",
        grade: "Grade",
        teachersComments: "Teacher's Comments & Feedback",
        finalComment: "Final Comment",
        noComments: "No comments from your teacher yet.",
        gradeNotVisible: "Your grade is not yet visible.",
        gradesNotAvailable: "Your grades are not available yet. Please check back later.",
        toggleLanguage: "Switch to Spanish"
    },
    es: {
        myFinalGrades: "Mis Calificaciones Finales",
        resultsDescription: "Aquí están tus resultados finales para el período reciente.",
        downloadPdf: "Descargar PDF",
        teacher: "Profesor",
        finalGrade: "Calificación Final",
        notReadyYet: "Aún no está listo",
        assignmentGrades: "Calificaciones de Tareas",
        assignment: "Tarea",
        grade: "Calificación",
        teachersComments: "Comentarios del Profesor",
        finalComment: "Comentario Final",
        noComments: "Aún no hay comentarios de tu profesor.",
        gradeNotVisible: "Tu calificación aún no está visible.",
        gradesNotAvailable: "Tus calificaciones aún no están disponibles. Por favor, vuelve a revisar más tarde.",
        toggleLanguage: "Switch to English"
    }
};

export default function StudentPage() {
  const { toast } = useToast();
  const [gradesData, setGradesData] = useState<GradeInfo[]>([]);
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  const t = translations[language];

  useEffect(() => {
    const userJson = sessionStorage.getItem('currentUser');
    const user = userJson ? JSON.parse(userJson) : null;
    
    setCurrentUser(user);

    if (user) {
        const fetchData = async () => {
            const studentGrades = await getGradesByStudentId(user.studentId);
            const studentFeedback = await getFeedbackForStudent(user.id);
            
            const gradesWithFeedback = studentGrades.map(grade => {
                const sortedFeedback = studentFeedback.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                return {
                    ...grade,
                    feedbacks: sortedFeedback
                };
            });
            setGradesData(gradesWithFeedback);
        };
        fetchData();
    }
  }, []);

  const handleDownload = () => {
    toast({
        title: "Download Started",
        description: "Your grade report is being generated.",
    });
  }

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'es' : 'en');
  }
  
  if (gradesData.length === 0) {
    return (
         <div className="grid gap-6">
            <div className="flex items-center justify-between">
                <div>
                <h2 className="text-2xl font-bold tracking-tight">{t.myFinalGrades}</h2>
                <p className="text-muted-foreground">{t.resultsDescription}</p>
                </div>
                 <Button onClick={toggleLanguage}>
                    <Languages className="mr-2 h-4 w-4" />
                    {t.toggleLanguage}
                </Button>
            </div>
            <Card>
                <CardContent className="pt-6 flex flex-col items-center justify-center text-center gap-4 p-8">
                     <div className="p-4 bg-muted rounded-full">
                        <BookOpenCheck className="h-8 w-8 text-muted-foreground" />
                     </div>
                     <p className="text-sm font-medium">{t.gradesNotAvailable}</p>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t.myFinalGrades}</h2>
          <p className="text-muted-foreground">{t.resultsDescription}</p>
        </div>
        <div className="flex items-center gap-2">
            <Button onClick={toggleLanguage} variant="default">
                <Languages className="mr-2 h-4 w-4" />
                {t.toggleLanguage}
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <FileDown className="mr-2 h-4 w-4" />
              {t.downloadPdf}
            </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {gradesData.map(gradeInfo => (
            gradeInfo.visible ? (
                <Card key={gradeInfo.level} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{gradeInfo.level}</CardTitle>
                        <CardDescription>{t.teacher}: {gradeInfo.teacher}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-4">
                            <div className="p-6 rounded-lg bg-primary/10 text-center">
                                <p className="text-lg font-semibold text-primary/80">{t.finalGrade}</p>
                                <p className="text-5xl font-bold text-primary">{gradeInfo.grade || t.notReadyYet}</p>
                            </div>
                            <div>
                                <h3 className="text-base font-semibold mb-2">{t.assignmentGrades}</h3>
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>{t.assignment}</TableHead>
                                                <TableHead className="text-right">{t.grade}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {gradeInfo.assignmentGrades.map((ag, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{ag.title}</TableCell>
                                                    <TableCell className="text-right font-semibold">
                                                      {ag.grade || 'N/A'} / {ag.points || 100}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                         <div>
                            <h3 className="text-base font-semibold mb-2">{t.teachersComments}</h3>
                            <div className="space-y-4 max-h-[26rem] overflow-y-auto pr-2 border rounded-lg p-4 bg-muted/40">
                                {gradeInfo.comment && (
                                     <div className="text-sm p-3 bg-background rounded-md shadow-sm">
                                        <p className="font-semibold mb-1">{t.finalComment}</p>
                                        <p className="text-muted-foreground">{gradeInfo.comment}</p>
                                     </div>
                                )}
                                {gradeInfo.feedbacks.map((fb, index) => (
                                     <div key={index} className="text-sm p-3 bg-background rounded-md shadow-sm">
                                        <p className="text-xs font-semibold text-muted-foreground mb-1">{format(new Date(fb.date), "PPP p")}</p>
                                        <p>{fb.comment}</p>
                                     </div>
                                ))}
                                 {gradeInfo.feedbacks.length === 0 && !gradeInfo.comment && (
                                    <p className="text-sm text-muted-foreground text-center py-8">{t.noComments}</p>
                                 )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card key={gradeInfo.level} className="flex flex-col items-center justify-center bg-muted/50 border-dashed">
                     <CardHeader className="text-center">
                        <CardTitle>{gradeInfo.level}</CardTitle>
                        <CardDescription>{t.teacher}: {gradeInfo.teacher}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center text-center gap-4 p-8">
                        <div className="p-4 bg-background rounded-full">
                           <EyeOff className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">{t.gradeNotVisible}</p>
                    </CardContent>
                </Card>
            )
        ))}
      </div>
    </div>
  );
}