const express = require('express');
const router = express.Router();
const { Student, calculateGPA } = require('../models/Student');

// Get all students
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find().select('registrationNo gpa');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student by registration number
router.get('/student/:regNo', async (req, res) => {
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
router.post('/calculate-gpa/:regNo', async (req, res) => {
  try {
    const student = await Student.findOne({ registrationNo: req.params.regNo });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const gpa = calculateGPA(student.courses);
    student.gpa = gpa;
    await student.save();
    
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

// GPA breakdown helper function
function getGPABreakdown(courses) {
  const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0,
    'RX': 0.0, '-': 0.0
  };
  
  const eligibleCourses = courses.filter(course => 
    course.level >= 4 && course.level <= 7 && 
    course.grade !== '-' && course.grade !== 'RX'
  );
  
  const sortedCourses = eligibleCourses.sort((a, b) => {
    if (a.level >= 5 && a.isCompulsory && !(b.level >= 5 && b.isCompulsory)) return -1;
    if (b.level >= 5 && b.isCompulsory && !(a.level >= 5 && a.isCompulsory)) return 1;
    if (a.level >= 5 && !a.isCompulsory && b.level === 4) return -1;
    if (b.level >= 5 && !b.isCompulsory && a.level === 4) return 1;
    return 0;
  });
  
  let selectedCourses = [];
  let totalCredits = 0;
  
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

module.exports = router;