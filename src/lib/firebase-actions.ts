'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, setDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import type { Student, Teacher, Level, Admin, Grade, Feedback, HistoricalGrade, AssignmentGrade } from './data';

// Generic fetch
async function getCollection<T>(collectionName: string): Promise<T[]> {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

// Generic get by ID
async function getDocumentById<T>(collectionName: string, id: string): Promise<T | null> {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
}

// Generic add
async function addDocument<T>(collectionName: string, data: Omit<T, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, collectionName), data);
    return docRef.id;
}

// Generic update/set (set with merge is safer for updates)
async function updateDocument<T>(collectionName: string, id: string, data: Partial<T>) {
    await setDoc(doc(db, collectionName, id), data, { merge: true });
}

// Generic set (overwrite)
async function setDocument<T>(collectionName: string, id: string, data: T) {
    await setDoc(doc(db, collectionName, id), data);
}


// Generic delete
async function deleteDocument(collectionName: string, id: string) {
    await deleteDoc(doc(db, collectionName, id));
}

// Student actions
export async function getStudents(): Promise<Student[]> { return getCollection('students'); }
export async function addStudent(student: Omit<Student, 'id'>): Promise<string> { return addDocument('students', student); }
export async function updateStudent(id: string, student: Partial<Student>): Promise<void> { return updateDocument('students', id, student); }
export async function deleteStudent(id: string): Promise<void> { return deleteDocument('students', id); }
export async function getStudentByStudentId(studentId: string): Promise<Student | null> {
    const q = query(collection(db, "students"), where("studentId", "==", studentId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Student;
}
export async function batchAddStudents(students: Omit<Student, 'id'>[]) {
    const batch = writeBatch(db);
    students.forEach(student => {
        const docRef = doc(collection(db, 'students'));
        batch.set(docRef, student);
    });
    await batch.commit();
}


// Teacher actions
export async function getTeachers(): Promise<Teacher[]> { return getCollection('teachers'); }
export async function getTeacherByName(name: string): Promise<Teacher | null> {
     const q = query(collection(db, "teachers"), where("name", "==", name));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Teacher;
}
export async function getTeacherByUsername(username: string): Promise<Teacher | null> {
    const q = query(collection(db, "teachers"), where("username", "==", username));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Teacher;
}
export async function addTeacher(teacher: Omit<Teacher, 'id'>): Promise<string> { return addDocument('teachers', teacher); }
export async function updateTeacher(id: string, teacher: Partial<Teacher>): Promise<void> { return updateDocument('teachers', id, teacher); }
export async function deleteTeacher(id: string): Promise<void> { return deleteDocument('teachers', id); }

// Level actions
export async function getLevels(): Promise<Level[]> { return getCollection('levels'); }
export async function getLevelByName(name: string): Promise<Level | null> {
     const q = query(collection(db, "levels"), where("name", "==", name));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Level;
}
export async function addLevel(level: Omit<Level, 'id'>): Promise<string> { return addDocument('levels', level); }
export async function updateLevel(id: string, level: Partial<Level>): Promise<void> { return updateDocument('levels', id, level); }
export async function deleteLevel(id: string): Promise<void> { return deleteDocument('levels', id); }

// Admin actions
export async function getAdmins(): Promise<Admin[]> { return getCollection('admins'); }
export async function getAdminByUsername(username: string): Promise<Admin | null> {
    const q = query(collection(db, "admins"), where("username", "==", username));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Admin;
}
export async function addAdmin(admin: Omit<Admin, 'id'>): Promise<string> { return addDocument('admins', admin); }
export async function updateAdmin(id: string, admin: Partial<Admin>): Promise<void> { return updateDocument('admins', id, admin); }
export async function deleteAdmin(id: string): Promise<void> { return deleteDocument('admins', id); }

// Grade actions
export async function getGrades(): Promise<Grade[]> { return getCollection('grades'); }
export async function getGradesByStudentId(studentId: string): Promise<Grade[]> {
    const q = query(collection(db, "grades"), where("studentId", "==", studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grade));
}
export async function getGradeByStudentAndLevel(studentId: string, level: string): Promise<Grade | null> {
    const q = query(collection(db, "grades"), where("studentId", "==", studentId), where("level", "==", level));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Grade;
}
export async function getGradesByLevel(levelName: string): Promise<Grade[]> {
    const q = query(collection(db, "grades"), where("level", "==", levelName));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grade));
}
export async function getGradesByTeacher(teacherName: string): Promise<Grade[]> {
    const q = query(collection(db, "grades"), where("teacher", "==", teacherName));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grade));
}
export async function setGrade(grade: Grade) { return setDocument('grades', grade.id, grade); }


// Feedback actions
export async function getFeedbackForStudent(studentId: string): Promise<Feedback[]> {
    const q = query(collection(db, "feedback"), where("studentId", "==", studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
}
export async function addFeedback(feedback: Omit<Feedback, 'id'>): Promise<string> { return addDocument('feedback', feedback); }

// Historical Grade actions
export async function getHistoricalGrades(): Promise<HistoricalGrade[]> { return getCollection('historicalGrades'); }
export async function setHistoricalGrade(record: HistoricalGrade) { return setDocument('historicalGrades', record.id, record); }
export async function deleteHistoricalGrade(id: string): Promise<void> { return deleteDocument('historicalGrades', id); }