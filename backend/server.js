// server.js - Node.js Backend Server
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Student, calculateGPA } = require('./models/Student');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://kasunibandara97:MLGowj6CUu8whH9s@cluster0.fbhvj.mongodb.net/university_gpa', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));

// Routes

// Get all students (for testing)
app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find().select('registrationNo gpa');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student by registration number
app.get('/api/student/:regNo', async (req, res) => {
  try {
    const student = await Student.findOne({ registrationNo: req.params.regNo });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Calculate GPA for a student
app.post('/api/calculate-gpa/:regNo', async (req, res) => {
  try {
    const student = await Student.findOne({ registrationNo: req.params.regNo });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const gpa = calculateGPA(student.courses);
    
    // Update student's GPA in database
    student.gpa = gpa;
    await student.save();
    
    // Get detailed breakdown
    const breakdown = getGPABreakdown(student.courses);
    
    res.json({
      registrationNo: student.registrationNo,
      gpa: gpa,
      breakdown: breakdown,
      totalCourses: student.courses.length,
      eligibleCourses: breakdown.eligibleCourses.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get GPA breakdown for detailed view
function getGPABreakdown(courses) {
  const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0,
    'RX': 0.0, '-': 0.0
  };
  
  // Filter eligible courses (levels 4-7, excluding incomplete grades)
  const eligibleCourses = courses.filter(course => 
    course.level >= 4 && course.level <= 7 && 
    course.grade !== '-' && course.grade !== 'RX'
  );
  
  // Sort by priority
  const sortedCourses = eligibleCourses.sort((a, b) => {
    if (a.level >= 5 && a.isCompulsory && !(b.level >= 5 && b.isCompulsory)) return -1;
    if (b.level >= 5 && b.isCompulsory && !(a.level >= 5 && a.isCompulsory)) return 1;
    if (a.level >= 5 && !a.isCompulsory && b.level === 4) return -1;
    if (b.level >= 5 && !b.isCompulsory && a.level === 4) return 1;
    return 0;
  });
  
  let selectedCourses = [];
  let totalCredits = 0;
  
  // Select courses up to 90 credits
  for (let course of sortedCourses) {
    if (totalCredits + course.credits <= 90) {
      selectedCourses.push({
        ...course.toObject(),
        gradePoint: gradePoints[course.grade] || 0,
        weightedPoints: course.credits * (gradePoints[course.grade] || 0),
        status: 'full'
      });
      totalCredits += course.credits;
    } else if (totalCredits < 90) {
      const remainingCredits = 90 - totalCredits;
      selectedCourses.push({
        ...course.toObject(),
        gradePoint: gradePoints[course.grade] || 0,
        weightedPoints: remainingCredits * (gradePoints[course.grade] || 0),
        creditsUsed: remainingCredits,
        status: 'partial'
      });
      totalCredits = 90;
      break;
    }
  }
  
  return {
    eligibleCourses: eligibleCourses,
    selectedCourses: selectedCourses,
    totalCreditsUsed: totalCredits,
    totalWeightedPoints: selectedCourses.reduce((sum, course) => sum + course.weightedPoints, 0)
  };
}

// Add new student
app.post('/api/students', async (req, res) => {
  try {
    const student = new Student(req.body);
    const savedStudent = await student.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update student courses
app.put('/api/student/:regNo/courses', async (req, res) => {
  try {
    const student = await Student.findOne({ registrationNo: req.params.regNo });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    student.courses = req.body.courses;
    student.gpa = calculateGPA(student.courses);
    await student.save();
    
    res.json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;