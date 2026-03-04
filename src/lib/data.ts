// This file serves as the single source of truth for all data type definitions.

export type Student = {
    id: string; // Corresponds to Firestore document ID
    studentId: string;
    password: string;
    name: string;
    level: string;
    teacher: string;
    email: string;
    dropped: boolean;
};

export type Teacher = {
    id: string; // Corresponds to Firestore document ID
    name: string;
    username: string;
    password: string;
    level: string;
    students: number;
};

export type Level = {
    id: string; // Corresponds to Firestore document ID
    name: string;
    teachers: string;
    students: string;
};

export type Admin = {
    id: string; // Corresponds to Firestore document ID
    name:string;
    username: string;
    password: string;
};

export type Feedback = {
    id?: string; // Corresponds to Firestore document ID, optional as it's subcollected
    studentId: string;
    date: string;
    comment: string;
}

export type AssignmentGrade = {
    title: string;
    grade: string | number;
    points?: number;
};

export type Grade = {
    id: string; // Composite key like `${studentId}-${level}`
    studentId: string;
    level: string;
    teacher: string;
    grade: string;
    comment: string;
    visible: boolean;
    assignmentGrades: AssignmentGrade[];
}

export type HistoricalGrade = {
    id: string; // levelName, ensuring uniqueness
    lastSaved: string;
    levelName: string;
    teacherName: string;
    columns: { id: string; title: string; points: number }[];
    studentData: {
        studentId: string;
        studentName: string;
        grades: Record<string, string | number>;
        finalGrade: string;
    }[];
};