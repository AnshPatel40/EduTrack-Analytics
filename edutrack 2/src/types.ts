export interface SubjectScore {
  subject: string;
  marks: number;
}

export interface StudentData {
  studentId: string;
  attendance: number;
  internalMarks: number;
  assignmentMarks: number;
  finalResult: 'Pass' | 'Fail';
  subjects?: SubjectScore[];
  originalRow?: any; // For reference during cleaning
}

export interface Thresholds {
  attendance: number;
  marks: number;
}

export interface SubjectInsight {
  subjectName: string;
  performanceLevel: 'High' | 'Medium' | 'Low';
  trend: string;
  prediction: string;
}

export interface AIAnalysis {
  summary: string;
  trends: string[];
  atRiskStudentIds: string[];
  recommendations: string[];
  subjectInsights: SubjectInsight[];
  nextSemesterFailurePrediction: {
    studentId: string;
    reason: string;
    probability: string;
  }[];
}

export interface SubjectStats {
  subject: string;
  avgMarks: number;
  passRate: number;
}

export interface DashboardStats {
  totalStudents: number;
  avgAttendance: number;
  avgInternalMarks: number;
  passRatio: number;
  atRiskCount: number;
  subjectStats: SubjectStats[];
}
