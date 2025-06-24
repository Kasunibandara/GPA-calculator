import React, { useState } from 'react';
import { Search, Calculator, BookOpen, Award, AlertCircle, CheckCircle, User } from 'lucide-react';

const GPACalculatorApp = () => {
  const [registrationNo, setRegistrationNo] = useState('');
  const [student, setStudent] = useState(null);
  const [gpaResult, setGpaResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('search');

  // API base URL - update this to match your backend
  const API_BASE_URL = 'http://localhost:5000/api';

  const handleSearch = async () => {
    if (!registrationNo.trim()) {
      setError('Please enter a registration number');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/student/${registrationNo}`);
      
      if (response.ok) {
        const studentData = await response.json();
        setStudent(studentData);
        setActiveTab('details');
      } else if (response.status === 404) {
        setError('Student not found');
        setStudent(null);
      } else {
        setError('Error fetching student data');
        setStudent(null);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Error connecting to server');
      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateGPA = async () => {
    if (!student) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/calculate-gpa/${student.registrationNo}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setGpaResult(result);
        setActiveTab('result');
      } else {
        setError('Error calculating GPA');
      }
    } catch (err) {
      console.error('GPA calculation error:', err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setRegistrationNo('');
    setStudent(null);
    setGpaResult(null);
    setError('');
    setActiveTab('search');
  };

  const getGradeColor = (grade) => {
    if (['A+', 'A'].includes(grade)) return 'bg-green-100 text-green-800';
    if (['A-', 'B+', 'B'].includes(grade)) return 'bg-blue-100 text-blue-800';
    if (['B-', 'C+', 'C'].includes(grade)) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getClassification = (gpa) => {
    if (gpa >= 3.7) return 'First Class';
    if (gpa >= 3.3) return 'Second Class Upper';
    if (gpa >= 3.0) return 'Second Class Lower';
    if (gpa >= 2.0) return 'Pass';
    return 'Fail';
  };

  const renderSearchTab = () => (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calculator className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">GPA Calculation System</h1>
        <p className="text-gray-600 mt-2">Faculty of Engineering Technology</p>
        <p className="text-gray-500 text-sm">Open University of Sri Lanka</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Student Registration Number
          </label>
          <input
            type="text"
            value={registrationNo}
            onChange={(e) => setRegistrationNo(e.target.value)}
            placeholder="Enter Reg. No"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={handleClear}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            Enter
          </button>
        </div>
      </div>
    </div>
  );

  const renderDetailsTab = () => (
  <div className="bg-white rounded-lg shadow-lg p-6 w-full mx-auto"> {/* Changed from max-w-4xl to w-full */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Student Details</h2>
          <p className="text-gray-600">Registration No: {student?.registrationNo}</p>
        </div>
      </div>
      <button
        onClick={() => setActiveTab('search')}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
      >
        Back
      </button>
    </div>
    
    {/* Rest of the component remains the same */}
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Courses ({student?.courses?.length || 0} total)
      </h3>
      
      {[7, 6, 5, 4].map(level => {
        const levelCourses = student?.courses?.filter(course => course.level === level) || [];
        if (levelCourses.length === 0) return null;
        
        return (
          <div key={level} className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2 border-b pb-1">Level {level}</h4>
            <div className="grid gap-2">
              {levelCourses.map((course, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium">{course.courseCode}</span>
                    <span className="text-gray-600 ml-2">{course.courseName}</span>
                    {course.isCompulsory && (
                      <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        Compulsory
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{course.credits} credits</span>
                    <span className={`font-bold px-2 py-1 rounded text-sm ${getGradeColor(course.grade)}`}>
                      {course.grade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
    
    <div className="flex justify-center gap-4">
      <button
        onClick={calculateGPA}
        disabled={loading}
        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center gap-2"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Calculator className="w-5 h-5" />
        )}
        Calculate
      </button>
    </div>
  </div>
);

  const renderResultTab = () => (
  <div className="bg-white rounded-lg shadow-lg p-6 w-full mx-auto"> {/* Changed from max-w-4xl to w-full */}
    <div className="text-center mb-6">
      <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <Award className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800">GPA Calculated</h2>
      <p className="text-gray-600">Registration No: {student?.registrationNo}</p>
    </div>
    
    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg mb-6">
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700 mb-2">Your GPA</p>
        <p className="text-4xl font-bold text-green-600">{gpaResult?.gpa?.toFixed(2)}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-sm text-gray-600">
            Based on {gpaResult?.breakdown?.totalCreditsUsed} credits from {gpaResult?.eligibleCourses} eligible courses
          </span>
        </div>
      </div>
    </div>
    
    {/* Rest of the component remains the same */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Classification:</span>
            <span className="font-medium">{getClassification(gpaResult?.gpa)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Courses:</span>
            <span className="font-medium">{gpaResult?.totalCourses}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Eligible Courses:</span>
            <span className="font-medium">{gpaResult?.eligibleCourses}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Credits Used:</span>
            <span className="font-medium">{gpaResult?.breakdown?.totalCreditsUsed}/90</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Selected Courses</h3>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {gpaResult?.breakdown?.selectedCourses?.map((course, idx) => (
            <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
              <span className="font-medium">{course.courseCode}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">
                  {course.status === 'partial' ? course.creditsUsed : course.credits}cr
                </span>
                <span className={`px-2 py-1 rounded text-xs ${getGradeColor(course.grade)}`}>
                  {course.grade}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    
    <div className="flex justify-center gap-4">
      <button
        onClick={() => setActiveTab('details')}
        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
      >
        View Details
      </button>
      <button
        onClick={handleClear}
        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
      >
        New Calculation
      </button>
    </div>
  </div>
);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      {activeTab === 'search' && renderSearchTab()}
      {activeTab === 'details' && renderDetailsTab()}
      {activeTab === 'result' && renderResultTab()}
    </div>
  );
};

export default GPACalculatorApp;