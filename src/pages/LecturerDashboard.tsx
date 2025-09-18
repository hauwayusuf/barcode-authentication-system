import React, { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { BookOpen, Users, Edit3, Save, RefreshCw, Check, X } from 'lucide-react'

interface Course {
  id: string
  name: string
  code: string
  totalStudents: number
}

interface Student {
  id: string
  student_id: string
  first_name: string
  last_name: string
  attendance_score: number
  attendance_percentage: number
  can_print: boolean
}

export const LecturerDashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [editingStudent, setEditingStudent] = useState<string | null>(null)
  const [tempScore, setTempScore] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCourses()
  }, [])

  const loadCourses = async () => {
    setLoading(true)
    try {
      // Try to load from API first
      const apiUrl = import.meta.env.VITE_API_URL
      if (apiUrl) {
        const response = await fetch(`${apiUrl}/lecturer/courses`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setCourses(data.data.map((course: any) => ({
              id: course.id,
              name: course.name,
              code: course.code,
              totalStudents: 0 // Will be updated when course is selected
            })))
            setLoading(false)
            return
          }
        }
      }
      
      // Fallback to demo data
      setCourses([
        { id: '1', name: 'Software Engineering', code: 'CS301', totalStudents: 5 },
        { id: '2', name: 'Database Systems', code: 'CS302', totalStudents: 5 },
        { id: '3', name: 'Computer Networks', code: 'CS401', totalStudents: 5 },
      ])
    } catch (error) {
      console.error('Error loading courses:', error)
      // Use demo data as fallback
      setCourses([
        { id: '1', name: 'Software Engineering', code: 'CS301', totalStudents: 5 },
        { id: '2', name: 'Database Systems', code: 'CS302', totalStudents: 5 },
        { id: '3', name: 'Computer Networks', code: 'CS401', totalStudents: 5 },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedCourse) {
      loadStudents(selectedCourse.id)
    }
  }, [selectedCourse])

  const loadStudents = async (courseId: string) => {
    setLoading(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL
      if (apiUrl) {
        const response = await fetch(`${apiUrl}/lecturer/course-students/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const studentsData = data.data.map((student: any) => ({
              id: student.id,
              student_id: student.student_id,
              first_name: student.name.split(' ')[0],
              last_name: student.name.split(' ').slice(1).join(' '),
              attendance_score: student.student_courses?.[0]?.attendance_score || 0,
              attendance_percentage: student.student_courses?.[0]?.attendance_percentage || 0,
              can_print: student.student_courses?.[0]?.can_print || false
            }))
            setStudents(studentsData)
            setLoading(false)
            return
          }
        }
      }
      
      // Fallback demo data
      const sampleStudents: Student[] = [
        { id: '1', student_id: 'CS2021001', first_name: 'John', last_name: 'Doe', attendance_score: 45, attendance_percentage: 75.0, can_print: true },
        { id: '2', student_id: 'CS2021002', first_name: 'Jane', last_name: 'Smith', attendance_score: 38, attendance_percentage: 63.3, can_print: false },
        { id: '3', student_id: 'CS2021003', first_name: 'Mike', last_name: 'Johnson', attendance_score: 50, attendance_percentage: 83.3, can_print: true },
        { id: '4', student_id: 'CS2021004', first_name: 'Sarah', last_name: 'Williams', attendance_score: 42, attendance_percentage: 70.0, can_print: true },
        { id: '5', student_id: 'CS2021005', first_name: 'David', last_name: 'Brown', attendance_score: 35, attendance_percentage: 58.3, can_print: false },
      ]
      setStudents(sampleStudents)
    } catch (error) {
      console.error('Error loading students:', error)
      // Use demo data as fallback
      const sampleStudents: Student[] = [
        { id: '1', student_id: 'CS2021001', first_name: 'John', last_name: 'Doe', attendance_score: 45, attendance_percentage: 75.0, can_print: true },
        { id: '2', student_id: 'CS2021002', first_name: 'Jane', last_name: 'Smith', attendance_score: 38, attendance_percentage: 63.3, can_print: false },
        { id: '3', student_id: 'CS2021003', first_name: 'Mike', last_name: 'Johnson', attendance_score: 50, attendance_percentage: 83.3, can_print: true },
        { id: '4', student_id: 'CS2021004', first_name: 'Sarah', last_name: 'Williams', attendance_score: 42, attendance_percentage: 70.0, can_print: true },
        { id: '5', student_id: 'CS2021005', first_name: 'David', last_name: 'Brown', attendance_score: 35, attendance_percentage: 58.3, can_print: false },
      ]
      setStudents(sampleStudents)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveIndividualScore = async (studentId: string) => {
    setSaving(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL
      if (apiUrl) {
        const response = await fetch(`${apiUrl}/lecturer/update-attendance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({
            student_id: studentId,
            course_id: selectedCourse?.id,
            score: tempScore
          })
        })
        
        const data = await response.json()
        if (data.success) {
          // Update local state
          const updatedStudents = students.map(student => {
            if (student.id === studentId) {
              const newPercentage = (tempScore / 60) * 100
              return {
                ...student,
                attendance_score: tempScore,
                attendance_percentage: newPercentage,
                can_print: newPercentage >= 70
              }
            }
            return student
          })
          
          setStudents(updatedStudents)
          setEditingStudent(null)
          alert(`Attendance updated successfully for ${students.find(s => s.id === studentId)?.first_name}!`)
          return
        } else {
          throw new Error(data.message || 'Failed to update attendance')
        }
      }
      
      // Demo mode - simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update local state
      const updatedStudents = students.map(student => {
        if (student.id === studentId) {
          const newPercentage = (tempScore / 60) * 100
          return {
            ...student,
            attendance_score: tempScore,
            attendance_percentage: newPercentage,
            can_print: newPercentage >= 70
          }
        }
        return student
      })
      
      setStudents(updatedStudents)
      setEditingStudent(null)
      alert(`Attendance updated successfully for ${students.find(s => s.id === studentId)?.first_name}!`)
    } catch (error) {
      console.error('Error saving individual score:', error)
      alert('Error saving attendance. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const startEditingStudent = (studentId: string, currentScore: number) => {
    setEditingStudent(studentId)
    setTempScore(currentScore)
  }

  const cancelEditingStudent = () => {
    setEditingStudent(null)
    setTempScore(0)
  }

  const handleBulkUpdate = () => {
    const score = parseInt(bulkScore)
    if (score >= 0 && score <= 60) {
      const updatedScores: { [key: string]: number } = {}
      students.forEach(student => {
        updatedScores[student.id] = score
      })
      setEditedScores(updatedScores)
      setBulkScore('')
      alert(`Bulk update applied: ${score}/60 for all students`)
    } else {
      alert('Please enter a valid score between 0 and 60')
    }
  }

  const handleIndividualScoreChange = (value: number) => {
    if (value >= 0 && value <= 60) {
      setTempScore(value)
    }
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600'
    if (percentage >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-50'
    if (percentage >= 60) return 'bg-yellow-50'
    return 'bg-red-50'
  }

  const getEligibilityStatus = (percentage: number) => {
    if (percentage >= 70) return { text: 'Eligible', color: 'text-green-600 bg-green-50' }
    if (percentage >= 60) return { text: 'At Risk', color: 'text-yellow-600 bg-yellow-50' }
    return { text: 'Not Eligible', color: 'text-red-600 bg-red-50' }
  }

  const calculateNewPercentage = (score: number) => {
    return (score / 60) * 100
  }

  const validateScore = (score: number) => {
    return score >= 0 && score <= 60
  }

  return (
    <Layout title="Lecturer Dashboard">
      <div className="space-y-6">
        {!selectedCourse ? (
          <div>
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading courses...</span>
              </div>
            )}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">My Courses</h2>
              <p className="text-gray-600">Manage attendance for your assigned courses</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {course.name}
                          </h3>
                          <p className="text-sm text-gray-600">{course.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Users className="h-4 w-4 mr-2" />
                        <span className="text-sm">{course.totalStudents} students</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading students...</span>
              </div>
            )}
            <div className="flex items-center justify-between mb-6">
              <div>
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2"
                >
                  ← Back to Courses
                </button>
                <h2 className="text-2xl font-bold text-gray-900">{selectedCourse.name}</h2>
                <p className="text-gray-600">{selectedCourse.code} - Attendance Management</p>
              </div>
            </div>

            {/* Individual Edit Mode Info */}
            {editingStudent && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Edit3 className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="font-medium text-yellow-900">
                      Editing: {students.find(s => s.id === editingStudent)?.first_name} {students.find(s => s.id === editingStudent)?.last_name}
                    </span>
                  </div>
                  <button
                    onClick={cancelEditingStudent}
                    className="text-yellow-600 hover:text-yellow-800"
                    disabled={saving}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Students Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Student Attendance</h3>
                <p className="text-sm text-gray-600">Total students: {students.length}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => {
                      const isEditing = editingStudent === student.id
                      const currentScore = student.attendance_score
                      const currentPercentage = student.attendance_percentage
                      const status = getEligibilityStatus(currentPercentage)
                      
                      return (
                        <tr key={student.id} className={`hover:bg-gray-50 ${isEditing ? 'bg-yellow-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.first_name} {student.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{student.student_id}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="60"
                                  value={tempScore}
                                  onChange={(e) => handleIndividualScoreChange(parseInt(e.target.value) || 0)}
                                  className={`w-16 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    validateScore(tempScore) ? 'border-gray-300' : 'border-red-300 bg-red-50'
                                  }`}
                                  disabled={saving}
                                />
                                <span className="text-sm text-gray-500">/60</span>
                              </div>
                            ) : (
                              <div className="text-sm font-medium text-gray-900">
                                {currentScore}/60
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${getScoreColor(currentPercentage)}`}>
                              {currentPercentage.toFixed(1)}%
                              {isEditing && (
                                <div className="text-xs text-gray-500">
                                  Preview: {calculateNewPercentage(tempScore).toFixed(1)}%
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                              {status.text}
                            </span>
                            {isEditing && (
                              <div className="mt-1">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEligibilityStatus(calculateNewPercentage(tempScore)).color}`}>
                                  → {getEligibilityStatus(calculateNewPercentage(tempScore)).text}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleSaveIndividualScore(student.id)}
                                  disabled={saving || !validateScore(tempScore)}
                                  className="flex items-center px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {saving ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )}
                                </button>
                                <button
                                  onClick={cancelEditingStudent}
                                  disabled={saving}
                                  className="flex items-center px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditingStudent(student.id, currentScore)}
                                disabled={saving || editingStudent !== null}
                                className="flex items-center px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Edit3 className="h-4 w-4 mr-1" />
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {students.filter(s => {
                      return s.attendance_percentage >= 70
                    }).length}
                  </div>
                  <div className="text-sm text-gray-600">Eligible Students</div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {students.filter(s => {
                      return s.attendance_percentage < 70
                    }).length}
                  </div>
                  <div className="text-sm text-gray-600">Not Eligible</div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {(() => {
                      const totalPercentage = students.reduce((sum, s) => sum + s.attendance_percentage, 0)
                      return (totalPercentage / students.length).toFixed(1)
                    })()
                    }%
                  </div>
                  <div className="text-sm text-gray-600">Class Average</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}