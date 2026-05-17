import { StudentData, DashboardStats, Thresholds, SubjectStats } from '../types';

export const parseCSVData = (data: any[]): StudentData[] => {
  return data
    .filter((row: any) => row['Student ID'] || row['studentId'])
    .map((row: any) => {
      const attendance = parseFloat(row['Attendance %'] || row['attendance'] || 0);
      const internalMarks = parseFloat(row['Internal Marks'] || row['internalMarks'] || 0);
      const assignmentMarks = parseFloat(row['Assignment Marks'] || row['assignmentMarks'] || 0);
      
      let finalResult = row['Final Result'] || row['finalResult'] || 'Fail';
      if (typeof finalResult === 'string') {
        finalResult = finalResult.toLowerCase().includes('pass') ? 'Pass' : 'Fail';
      }

      // Check for subject-wise marks if they exist as separate columns or JSON
      const subjects: any[] = [];
      const commonSubjects = ['Math', 'Science', 'English', 'History', 'CompSci'];
      
      commonSubjects.forEach(s => {
        if (row[s] !== undefined) {
          subjects.push({ subject: s, marks: parseFloat(row[s]) || 0 });
        }
      });

      return {
        studentId: String(row['Student ID'] || row['studentId']),
        attendance: isNaN(attendance) ? 0 : attendance,
        internalMarks: isNaN(internalMarks) ? 0 : internalMarks,
        assignmentMarks: isNaN(assignmentMarks) ? 0 : assignmentMarks,
        finalResult: finalResult as 'Pass' | 'Fail',
        subjects: subjects.length > 0 ? subjects : undefined,
        originalRow: row
      };
    });
};

export const calculateStats = (data: StudentData[], thresholds: Thresholds = { attendance: 75, marks: 40 }): DashboardStats => {
  if (data.length === 0) {
    return {
      totalStudents: 0,
      avgAttendance: 0,
      avgInternalMarks: 0,
      passRatio: 0,
      atRiskCount: 0,
      subjectStats: []
    };
  }

  const total = data.length;
  const avgAttendance = data.reduce((acc, curr) => acc + curr.attendance, 0) / total;
  const avgInternalMarks = data.reduce((acc, curr) => acc + curr.internalMarks, 0) / total;
  const passCount = data.filter(d => d.finalResult === 'Pass').length;
  
  // Use custom thresholds for at-risk calculation
  const atRiskCount = data.filter(d => 
    d.attendance < thresholds.attendance || 
    (d.internalMarks + d.assignmentMarks) < thresholds.marks
  ).length;

  // Subject-wise performance
  const subjectMap: Record<string, { totalMarks: number, count: number, passCount: number }> = {};
  
  data.forEach(student => {
    student.subjects?.forEach(s => {
      if (!subjectMap[s.subject]) {
        subjectMap[s.subject] = { totalMarks: 0, count: 0, passCount: 0 };
      }
      subjectMap[s.subject].totalMarks += s.marks;
      subjectMap[s.subject].count += 1;
      if (s.marks >= (thresholds.marks / 2)) { // simple passing logic per subject
        subjectMap[s.subject].passCount += 1;
      }
    });
  });

  const subjectStats: SubjectStats[] = Object.entries(subjectMap).map(([name, stat]) => ({
    subject: name,
    avgMarks: Number((stat.totalMarks / stat.count).toFixed(1)),
    passRate: Number(((stat.passCount / stat.count) * 100).toFixed(1))
  }));

  return {
    totalStudents: total,
    avgAttendance: Number(avgAttendance.toFixed(2)),
    avgInternalMarks: Number(avgInternalMarks.toFixed(2)),
    passRatio: Number(((passCount / total) * 100).toFixed(2)),
    atRiskCount,
    subjectStats
  };
};

export const generateSampleData = (): StudentData[] => {
  const samples: StudentData[] = [];
  const subjects = ['Math', 'Science', 'English', 'CompSci'];
  
  for (let i = 1; i <= 50; i++) {
    const att = 60 + Math.random() * 40;
    const marks = 30 + Math.random() * 60;
    const ass = 10 + Math.random() * 20;
    
    samples.push({
      studentId: `STU${1000 + i}`,
      attendance: Number(att.toFixed(1)),
      internalMarks: Number(marks.toFixed(1)),
      assignmentMarks: Number(ass.toFixed(1)),
      finalResult: (att > 75 && marks > 40) ? 'Pass' : Math.random() > 0.3 ? 'Pass' : 'Fail',
      subjects: subjects.map(s => ({
        subject: s,
        marks: Number((20 + Math.random() * 80).toFixed(1))
      }))
    });
  }
  return samples;
};
