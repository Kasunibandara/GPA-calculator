const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    required: true
  },
  credits: {
    type: Number,
    required: true,
    default: 3
  },
  isCompulsory: {
    type: Boolean,
    default: true
  }
});

const studentSchema = new mongoose.Schema({
  registrationNo: {
    type: String,
    required: true,
    unique: true
  },
  courses: [courseSchema],
  gpa: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Student = mongoose.model('Student', studentSchema);

// Grade Point Values
const gradePoints = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0,
  'RX': 0.0, '-': 0.0
};

// Function to calculate GPA
function calculateGPA(courses) {
  let totalWeightedPoints = 0;
  let totalCredits = 0;
  let partCreditPoints = 0;
  
  // Filter courses for levels 4, 5, 6, 7 only
  const eligibleCourses = courses.filter(course => 
    course.level >= 4 && course.level <= 7 && 
    course.grade !== '-' && course.grade !== 'RX'
  );
  
  // Sort courses by priority
  const sortedCourses = eligibleCourses.sort((a, b) => {
    if (a.level >= 5 && a.isCompulsory && !(b.level >= 5 && b.isCompulsory)) return -1;
    if (b.level >= 5 && b.isCompulsory && !(a.level >= 5 && a.isCompulsory)) return 1;
    if (a.level >= 5 && !a.isCompulsory && b.level === 4) return -1;
    if (b.level >= 5 && !b.isCompulsory && a.level === 4) return 1;
    return 0;
  });
  
  // Select courses up to 90 credits
  for (let course of sortedCourses) {
    const gradePoint = gradePoints[course.grade] || 0;
    
    if (totalCredits + course.credits <= 90) {
      totalWeightedPoints += course.credits * gradePoint;
      totalCredits += course.credits;
    } else if (totalCredits < 90) {
      const remainingCredits = 90 - totalCredits;
      totalWeightedPoints += remainingCredits * gradePoint;
      partCreditPoints += (course.credits - remainingCredits) * gradePoint;
      totalCredits = 90;
      break;
    }
  }
  
  const gpa = (totalWeightedPoints + partCreditPoints) / 90;  
  return Math.round(gpa * 100) / 100;
}

module.exports = {
  Student,
  gradePoints,
  calculateGPA
};