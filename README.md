# ETNS Grade Portal

This is a comprehensive grade management portal for the ETNS School of English, built with Next.js, Firebase, and Genkit. It provides distinct functionalities for three user roles: Admins, Teachers, and Students.

---

## Default Login Credentials

For initial setup and testing, you can use the following default credentials. It is highly recommended to change these in a production environment.

*   **Admin:**
    *   Username: `admin`
    *   Password: `password`
*   **Teacher:**
    *   Username: `jdoe` (for a teacher named John Doe)
    *   Password: `password`
*   **Student:**
    *   Student ID: `S001`
    *   Password: `password`

---

## Application Features

### 1. Admin Role

Admins have the highest level of access and can manage the entire school's data and structure.

- **Secure Login:** Admins have a dedicated login form to access their dashboard.
- **Unified Dashboard:**
  - **Statistics:** View at-a-glance cards showing the total number of students, teachers, and active levels.
  - **Student Distribution Chart:** A bar chart visualizes how many students are enrolled in each level.
- **Comprehensive Data Management (CRUD):**
  - **Manage Students:** Add, view, edit, and delete student profiles. This includes assigning them to levels and teachers.
  - **Manage Teachers:** Add, view, edit, and delete teacher profiles, including their assigned levels.
  - **Manage Levels:** Create and manage academic levels, assigning teachers and enrolling students.
  - **Manage Admins:** Add or remove other administrator accounts.
- **Powerful Tools & Reports:**
  - **Bulk Student Import:** Add multiple students at once by uploading a formatted Excel (.xlsx) file, which also automatically updates teacher and level associations.
  - **Impersonate Student:** Log in as any student to see their dashboard exactly as they see it, which is useful for troubleshooting.
  - **Final Grades Report:** View a complete list of final grades for all students, organized by level.
  - **Performance Reports:** See automatically generated reports for each level, highlighting the top 5 performing students and those who are below the passing threshold.
  - **Historical Gradebook Archive:** Access read-only snapshots of every gradebook each time a teacher saves their changes. This is perfect for auditing and tracking progress over time.
  - **Export Historical Data:** Download the entire historical gradebook archive as a multi-sheet Excel file for backup or external analysis.
  - **Print Student Lists:** Generate a clean, printable list of all students enrolled in a specific level.

---

### 2. Teacher Role

Teachers have a dedicated interface to manage their assigned classes and grade their students effectively.

- **Secure Login:** Teachers log in with their unique username and password.
- **Dynamic Gradebook:**
  - An interactive, spreadsheet-like gradebook for the teacher's assigned level.
  - **Customizable Columns:** Teachers can add or remove assignment/exam columns on the fly.
  - **Set Point Values:** Each column can have a custom point value (e.g., 100 points for a final exam, 25 for a quiz).
- **Efficient Grading:**
  - **Enter Grades:** Easily input numerical grades for each student and assignment.
  - **Cumulative Grade Calculation:** The gradebook automatically calculates and displays a cumulative grade for each student based on earned points versus total possible points.
  - **Set Final Grade:** Manually enter a final, official grade for each student.
  - **Control Visibility:** Teachers decide when to make final grades visible to students with a simple toggle switch per student.
- **AI-Powered Feedback:**
  - **Dated Feedback:** Add multiple, dated feedback comments for any student throughout the term.
  - **AI Comment Assistant:** An integrated Genkit AI flow helps teachers write more positive and constructive feedback. The assistant analyzes their comment and suggests an improved version.
- **Data Persistence:**
  - **Save Gradebook:** A single "Save" button saves all changes to grades, feedback, and visibility settings to the Firebase database.
  - **Automatic Archiving:** Saving the gradebook also automatically creates a snapshot that is sent to the Admin's historical archive.
- **Profile Management:**
  - A profile page shows the teacher's details and a list of all students assigned to them.

---

### 3. Student Role

Students have a simple, focused portal to view their academic progress and feedback.

- **Secure Login:** Students log in with their unique Student ID and password.
- **Personalized Grade View:**
  - Displays final grades for their level as soon as a teacher makes them visible.
  - If grades are not yet visible, a clear message is shown.
- **Detailed Grade Breakdown:**
  - Students can see a table of all their individual assignment grades and the points they were out of.
- **View Teacher Feedback:**
  - Access a chronological list of all comments and feedback left by their teacher.
- **Bilingual Interface:** Students can toggle the interface language between English and Spanish.
- **Profile Page:**
  - View their personal information (name, email, level, teacher).
  - See the official grading criteria for their level, showing how their final grade is calculated.
- **Download Report:** A button to download their grade report as a PDF (feature is stubbed and can be implemented).