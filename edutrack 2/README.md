# EduTrack: Student Academic Data Analysis & Performance Insights System

EduTrack is a modern, high-density web application designed for educational institutes to analyze student academic performance. It converts raw student data (attendance, marks, assignments) into meaningful visual insights and provides AI-powered diagnostics to identify at-risk students.

## 🚀 Key Features

- **Data Analytics Dashboard**: Real-time visualization of attendance vs. marks, pass/fail ratios, and performance trends using Recharts.
- **AI Diagnostics**: Leverages Google Gemini to automatically analyze data patterns and identify students who may need intervention.
- **Data Management**: Systematic cleaning and preprocessing of CSV-based student records.
- **Exportable Reports**: Generate professional, high-density PDF reports with one click.
- **Accessible Design**: Built with a focus on high contrast, clear typography, and responsive layout.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Motion, Lucide React, Recharts.
- **Backend**: Node.js (Express), TypeScript, Google Generative AI SDK (Gemini).
- **Data Handling**: PapaParse for CSV processing.
- **Reporting**: jsPDF & html2canvas for PDF generation.

## 📋 Prerequisites

- Node.js installed on your machine.
- A **Google Gemini API Key** (configured in your environment).

## ⚙️ Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/edutrack.git
   cd edutrack
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

6. **Start Production Server**:
   ```bash
   npm run start
   ```

## 📊 Data Format (CSV)

The system expects a CSV file with the following columns:
- `Student ID` (String)
- `Attendance %` (Number)
- `Internal Marks` (Number)
- `Assignment Marks` (Number)
- `Final Result` (Pass/Fail)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

Distributed under the Apache-2.0 License. See `LICENSE` for more information.

---
*Created as part of an open-source initiative for better educational tools.*
