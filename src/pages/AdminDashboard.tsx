import React, { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  UserPlus, 
  Plus, 
  ChevronRight,
  Edit3,
  Award,
  Building
} from 'lucide-react'

interface Department {
  id: string
  name: string
}

interface Course {
  id: string
  name: string
  code: string
  duration_years: number
}

interface Level {
  id: string
  level_number: number
  name: string
}

interface Student {
  id: string
  student_id: string
  first_name: string
  last_name: string
  email: string
}

type ModalType = 'student' | 'lecturer' | 'course' | 'exception' | 'department'

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null)
  
  const [departments, setDepartments] = useState<Department[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [students, setStudents] = useState<Student[]>([])

  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<ModalType>('student')
  const [formData, setFormData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [totalStudents, setTotalStudents] = useState(0)
  const [totalLecturers, setTotalLecturers] = useState(0)

  // Sample data
  useEffect(() => {
    loadDepartments()
    loadOverviewStats()
  }, [])

  const loadOverviewStats = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL
      if (apiUrl) {
        // Load total students
        const studentsResponse = await fetch(`${apiUrl}/admin/stats/students`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json()
          if (studentsData.success) {
            setTotalStudents(studentsData.count)
          }
        }

        // Load total lecturers
        const lecturersResponse = await fetch(`${apiUrl}/admin/stats/lecturers`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
        if (lecturersResponse.ok) {
          const lecturersData = await lecturersResponse.json()
          if (lecturersData.success) {
            setTotalLecturers(lecturersData.count)
          }
        }
      } else {
        // Demo mode - calculate from current data
        setTotalStudents(15) // Demo count
        setTotalLecturers(3)  // Demo count
      }
    } catch (error) {
      console.error('Error loading overview stats:', error)
      setTotalStudents(15) // Fallback
      setTotalLecturers(3)  // Fallback
    }
  }
  const loadDepartments = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL
      if (apiUrl) {
        const response = await fetch(`${apiUrl}/admin/departments`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setDepartments(data.data)
            return
          }
        }
      }
      
      // Fallback to demo data
      setDepartments([
        { id: '1', name: 'Computer Science' },
        { id: '2', name: 'Mathematics' },
        { id: '3', name: 'Physics' },
      ])
    } catch (error) {
      console.error('Error loading departments:', error)
      setDepartments([
        { id: '1', name: 'Computer Science' },
        { id: '2', name: 'Mathematics' },
        { id: '3', name: 'Physics' },
      ])
    }
  }

  useEffect(() => {
    if (selectedDepartment) {
      loadCourses(selectedDepartment.id)
    }
  }, [selectedDepartment])

  const loadCourses = async (departmentId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL
      if (apiUrl) {
        const response = await fetch(`${apiUrl}/admin/courses/${departmentId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setCourses(data.data)
            return
          }
        }
      }
      
      // Fallback to demo data
      setCourses([
        { id: '1', name: 'Software Engineering', code: 'CS301', duration_years: 4 },
        { id: '2', name: 'Computer Networks', code: 'CS401', duration_years: 4 },
        { id: '3', name: 'Database Systems', code: 'CS302', duration_years: 4 },
      ])
    } catch (error) {
      console.error('Error loading courses:', error)
      setCourses([
        { id: '1', name: 'Software Engineering', code: 'CS301', duration_years: 4 },
        { id: '2', name: 'Computer Networks', code: 'CS401', duration_years: 4 },
        { id: '3', name: 'Database Systems', code: 'CS302', duration_years: 4 },
      ])
    }
  }

  useEffect(() => {
    if (selectedCourse) {
      const maxLevel = selectedCourse.duration_years === 4 ? 400 : 500
      const levelNumbers = [100, 200, 300, 400]
      if (maxLevel === 500) levelNumbers.push(500)
      
      setLevels(
        levelNumbers.map(num => ({
          id: `${selectedCourse.id}-${num}`,
          level_number: num,
          name: `${selectedCourse.name} - Level ${num}`
        }))
      )
    }
  }, [selectedCourse])

  useEffect(() => {
    if (selectedLevel) {
      setStudents([
        { id: '1', student_id: 'CS2021001', first_name: 'John', last_name: 'Doe', email: 'john.doe@student.edu' },
        { id: '2', student_id: 'CS2021002', first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@student.edu' },
        { id: '3', student_id: 'CS2021003', first_name: 'Mike', last_name: 'Johnson', email: 'mike.johnson@student.edu' },
      ])
    }
  }, [selectedLevel])

  const statsCards = [
    { title: 'Total Students', count: totalStudents.toString(), icon: Users, color: 'bg-blue-500' },
    { title: 'Active Courses', count: '9', icon: BookOpen, color: 'bg-green-500' },
    { title: 'Lecturers', count: totalLecturers.toString(), icon: GraduationCap, color: 'bg-purple-500' },
    { title: 'Departments', count: departments.length.toString(), icon: Building, color: 'bg-orange-500' },
  ]

  const breadcrumb = []
  if (selectedDepartment) breadcrumb.push(selectedDepartment.name)
  if (selectedCourse) breadcrumb.push(selectedCourse.name)
  if (selectedLevel) breadcrumb.push(`Level ${selectedLevel.level_number}`)

  const handleGrantException = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL
      if (!apiUrl) {
        // Demo mode - show success message
        alert(`Exception granted successfully!\n\nStudent: ${formData.student_id}\nCourse: ${formData.course_name}\nReason: ${formData.reason}\n\nEmail notification sent to: ${formData.student_email}`)
        setShowModal(false)
        setFormData({})
        setLoading(false)
        return
      }

      const response = await fetch(`${apiUrl}/admin/grant-exception`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          student_id: formData.student_id,
          course_id: formData.course_id,
          reason: formData.reason,
          student_email: formData.student_email,
          course_name: formData.course_name
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Exception granted successfully! Email notification sent to student.')
        setShowModal(false)
        setFormData({})
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Error granting exception:', error)
      alert('Error granting exception. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL
      if (!apiUrl) {
        // Demo mode - show success message
        alert(`Student added successfully!\n\nStudent ID: ${formData.student_id}\nName: ${formData.first_name} ${formData.last_name}\nEmail: ${formData.email}`)
        setShowModal(false)
        setFormData({})
        setLoading(false)
        return
      }

      const response = await fetch(`${apiUrl}/admin/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          student_id: formData.student_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          department_id: formData.department_id,
          course_id: formData.course_id,
          level_id: formData.level_id
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Student added successfully!')
        setShowModal(false)
        setFormData({})
        // Refresh data and stats
        loadDepartments()
        loadOverviewStats()
        if (selectedLevel) {
          // Reload students for current level
          setStudents([...students, {
            id: data.data.id,
            student_id: formData.student_id,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email
          }])
        }
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Error adding student:', error)
      alert('Error adding student. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddLecturer = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL
      if (!apiUrl) {
        // Demo mode - show success message
        alert(`Lecturer registered successfully!\n\nStaff ID: ${formData.lecturer_id}\nName: ${formData.first_name} ${formData.last_name}\nEmail: ${formData.email}`)
        setShowModal(false)
        setFormData({})
        setLoading(false)
        return
      }

      const response = await fetch(`${apiUrl}/admin/lecturers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          lecturer_id: formData.lecturer_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          department_id: formData.department_id
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Lecturer registered successfully!')
        setShowModal(false)
        setFormData({})
        // Refresh stats
        loadDepartments()
        loadOverviewStats()
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Error registering lecturer:', error)
      alert('Error registering lecturer. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL
      if (!apiUrl) {
        // Demo mode - show success message
        alert(`Course added successfully!\n\nCourse: ${formData.course_name}\nCode: ${formData.course_code}\nDuration: ${formData.duration_years} years`)
        setShowModal(false)
        setFormData({})
        setLoading(false)
        return
      }

      const response = await fetch(`${apiUrl}/admin/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          name: formData.course_name,
          code: formData.course_code,
          department_id: selectedDepartment?.id || formData.department_id,
          duration_years: formData.duration_years
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Course added successfully!')
        setShowModal(false)
        setFormData({})
        if (selectedDepartment) {
          loadCourses(selectedDepartment.id)
        }
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Error adding course:', error)
      alert('Error adding course. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const apiUrl = import.meta.env.VITE_API_URL
      if (!apiUrl) {
        // Demo mode - show success message
        alert(`Department added successfully!\n\nDepartment: ${formData.department_name}\nCode: ${formData.department_code}`)
        setShowModal(false)
        setFormData({})
        setLoading(false)
        return
      }

      const response = await fetch(`${apiUrl}/admin/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          name: formData.department_name,
          code: formData.department_code
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Department added successfully!')
        setShowModal(false)
        setFormData({})
        loadDepartments()
      } else {
        alert(`Error: ${data.message}`)
      }
    } catch (error) {
      console.error('Error adding department:', error)
      alert('Error adding department. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'hierarchy'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Manage Structure
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((stat, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => {
                    setModalType('student')
                    setShowModal(true)
                  }}
                  className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <UserPlus className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium">Add Student</span>
                </button>
                <button
                  onClick={() => {
                    setModalType('lecturer')
                    setShowModal(true)
                  }}
                  className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <GraduationCap className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium">Add Lecturer</span>
                </button>
                <button
                  onClick={() => {
                    setModalType('course')
                    setShowModal(true)
                  }}
                  className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <BookOpen className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="text-sm font-medium">Add Course</span>
                </button>
                <button
                  onClick={() => {
                    setModalType('exception')
                    setShowModal(true)
                  }}
                  className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Award className="h-5 w-5 text-orange-600 mr-2" />
                  <span className="text-sm font-medium">Grant Exception</span>
                </button>
              </div>
              
              {/* Test Email Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={async () => {
                    const email = prompt('Enter email address to test:')
                    if (email) {
                      try {
                        const response = await fetch(`${import.meta.env.VITE_API_URL}/test-email`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                          },
                          body: JSON.stringify({ email })
                        })
                        const data = await response.json()
                        alert(data.success ? `✅ ${data.message}` : `❌ ${data.message}`)
                      } catch (error) {
                        alert('❌ Failed to send test email. Check server configuration.')
                      }
                    }
                  }}
                  className="flex items-center px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  📧 Test Email Configuration
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hierarchy' && (
          <div className="space-y-6">
            {/* Breadcrumb */}
            {breadcrumb.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <button
                  onClick={() => {
                    setSelectedDepartment(null)
                    setSelectedCourse(null)
                    setSelectedLevel(null)
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Departments
                </button>
                {breadcrumb.map((item, index) => (
                  <React.Fragment key={index}>
                    <ChevronRight className="h-4 w-4" />
                    <span className={index === breadcrumb.length - 1 ? 'font-medium' : 'text-blue-600 hover:text-blue-800 cursor-pointer'}>
                      {item}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Content based on navigation level */}
            {!selectedDepartment && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Departments</h3>
                  <button 
                    onClick={() => {
                      setModalType('department')
                      setShowModal(true)
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Department
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {departments.map((dept) => (
                    <div
                      key={dept.id}
                      onClick={() => setSelectedDepartment(dept)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors"
                    >
                      <h4 className="font-medium text-gray-900">{dept.name}</h4>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDepartment && !selectedCourse && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Courses in {selectedDepartment.name}</h3>
                  <button 
                    onClick={() => {
                      setModalType('course')
                      setShowModal(true)
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Course
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors"
                    >
                      <h4 className="font-medium text-gray-900">{course.name}</h4>
                      <p className="text-sm text-gray-600">{course.code}</p>
                      <p className="text-xs text-gray-500">{course.duration_years} years</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedCourse && !selectedLevel && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Levels in {selectedCourse.name}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {levels.map((level) => (
                    <div
                      key={level.id}
                      onClick={() => setSelectedLevel(level)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-colors"
                    >
                      <h4 className="font-medium text-gray-900">Level {level.level_number}</h4>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedLevel && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Students in Level {selectedLevel.level_number}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setModalType('student')
                        setShowModal(true)
                      }}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Student
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.student_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.first_name} {student.last_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {student.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button className="text-orange-600 hover:text-orange-900">
                              <Award className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for forms */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {modalType === 'student' && 'Add Student'}
                {modalType === 'lecturer' && 'Register Lecturer'}
                {modalType === 'course' && 'Add Course'}
                {modalType === 'department' && 'Add Department'}
                {modalType === 'exception' && 'Grant Exception'}
              </h3>
              
              <form 
                className="space-y-4"
                onSubmit={
                  modalType === 'student' ? handleAddStudent :
                  modalType === 'lecturer' ? handleAddLecturer :
                  modalType === 'course' ? handleAddCourse :
                  modalType === 'department' ? handleAddDepartment :
                  handleGrantException
                }
              >
                {modalType === 'student' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.department_id || ''}
                        onChange={(e) => {
                          const dept = departments.find(d => d.id === e.target.value)
                          setSelectedDepartment(dept || null)
                          setFormData({ ...formData, department_id: e.target.value })
                        }}
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    {selectedDepartment && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.course_id || ''}
                          onChange={(e) => {
                            const course = courses.find(c => c.id === e.target.value)
                            setSelectedCourse(course || null)
                            setFormData({ ...formData, course_id: e.target.value })
                          }}
                          required
                        >
                          <option value="">Select Course</option>
                          {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {selectedCourse && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                        <select 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={formData.level_id || ''}
                          onChange={(e) => setFormData({ ...formData, level_id: e.target.value })}
                          required
                        >
                          <option value="">Select Level</option>
                          {levels.map(level => (
                            <option key={level.id} value={level.id}>Level {level.level_number}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                      <input 
                        type="text" 
                        value={formData.student_id || ''}
                        onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input 
                          type="text" 
                          value={formData.first_name || ''}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input 
                          type="text" 
                          value={formData.last_name || ''}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input 
                        type="email" 
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="student@university.edu"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Use a real email address for notifications</p>
                    </div>
                  </>
                )}

                {modalType === 'lecturer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.department_id || ''}
                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Staff ID</label>
                      <input 
                        type="text" 
                        value={formData.lecturer_id || ''}
                        onChange={(e) => setFormData({ ...formData, lecturer_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input 
                          type="text" 
                          value={formData.first_name || ''}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input 
                          type="text" 
                          value={formData.last_name || ''}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input 
                        type="email" 
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="lecturer@university.edu"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        required
                      />
                    </div>
                  </>
                )}

                {modalType === 'course' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Course Name</label>
                      <input 
                        type="text" 
                        value={formData.course_name || ''}
                        onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                        placeholder="e.g., Software Engineering"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Course Code</label>
                      <input 
                        type="text" 
                        value={formData.course_code || ''}
                        onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                        placeholder="e.g., CS301"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Years)</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.duration_years || ''}
                        onChange={(e) => setFormData({ ...formData, duration_years: parseInt(e.target.value) })}
                        required
                      >
                        <option value="">Select Duration</option>
                        <option value="3">3 Years</option>
                        <option value="4">4 Years</option>
                        <option value="5">5 Years</option>
                      </select>
                    </div>
                  </>
                )}

                {modalType === 'department' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Department Name</label>
                      <input 
                        type="text" 
                        value={formData.department_name || ''}
                        onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                        placeholder="e.g., Computer Science"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        required
                      />
                    </div>
                  </>
                )}

                {modalType === 'exception' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.student_id || ''}
                        onChange={(e) => {
                          const selectedOption = e.target.options[e.target.selectedIndex]
                          const studentEmail = selectedOption.getAttribute('data-email')
                          setFormData({
                            ...formData,
                            student_id: e.target.value,
                            student_email: studentEmail || ''
                          })
                        }}
                        required
                      >
                        <option value="">Select a student who needs exception</option>
                        <optgroup label="Computer Science Students">
                          <option value="1" data-email="saada6818@bazeuniversity.edu.ng">CS2021001 - Saada (Computer Science - 65.5%)</option>
                          <option value="2" data-email="john.doe@student.edu">CS2021002 - John Doe (Software Engineering - 63.3%)</option>
                          <option value="3" data-email="jane.smith@student.edu">CS2021003 - Jane Smith (Database Systems - 58.3%)</option>
                        </optgroup>
                        <optgroup label="Information Technology Students">
                          <option value="4" data-email="hauwa6867@bazeuniversity.edu.ng">IT2021001 - Hauwa (Information Technology - 62.8%)</option>
                          <option value="5" data-email="mike.johnson@student.edu">IT2021002 - Mike Johnson (Computer Networks - 65.0%)</option>
                        </optgroup>
                        <optgroup label="Information Systems Management Students">
                          <option value="6" data-email="inna5251@bazeuniversity.edu.ng">ISM2021001 - Inna (Information Systems Management - 59.7%)</option>
                          <option value="7" data-email="sarah.wilson@student.edu">ISM2021002 - Sarah Wilson (Database Management - 55.0%)</option>
                        </optgroup>
                        <optgroup label="Other Students">
                          <option value="8" data-email="david.brown@student.edu">MATH2021001 - David Brown (Linear Algebra - 62.5%)</option>
                          <option value="9" data-email="emily.davis@student.edu">PHYS2021001 - Emily Davis (Quantum Physics - 59.2%)</option>
                        </optgroup>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Only students below 70% attendance are shown</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.course_id || ''}
                        onChange={(e) => {
                          const selectedOption = e.target.options[e.target.selectedIndex]
                          const courseName = selectedOption.textContent
                          setFormData({
                            ...formData,
                            course_id: e.target.value,
                            course_name: courseName || ''
                          })
                        }}
                        required
                      >
                        <option value="">Select the course for exception</option>
                        <optgroup label="Computer Science Courses">
                          <option value="1">CS401 - Computer Science (400 Level)</option>
                          <option value="2">CS301 - Software Engineering</option>
                          <option value="3">CS302 - Database Systems</option>
                        </optgroup>
                        <optgroup label="Information Technology Courses">
                          <option value="4">IT401 - Information Technology (400 Level)</option>
                          <option value="5">IT301 - Network Administration</option>
                          <option value="6">IT302 - System Analysis</option>
                        </optgroup>
                        <optgroup label="Information Systems Management Courses">
                          <option value="7">ISM401 - Information Systems Management (400 Level)</option>
                          <option value="8">ISM301 - Business Information Systems</option>
                          <option value="9">ISM302 - Project Management</option>
                        </optgroup>
                        <optgroup label="Other Courses">
                          <option value="10">MATH201 - Calculus I</option>
                          <option value="11">PHYS401 - Quantum Physics</option>
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                      <textarea 
                        rows={3}
                        value={formData.reason || ''}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Medical emergency, family circumstances, official university business, etc."
                      ></textarea>
                      <p className="text-xs text-gray-500 mt-1">Provide detailed justification for the exception</p>
                    </div>
                  </>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setFormData({})
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        {modalType === 'student' && 'Add Student'}
                        {modalType === 'lecturer' && 'Register Lecturer'}
                        {modalType === 'course' && 'Add Course'}
                        {modalType === 'department' && 'Add Department'}
                        {modalType === 'exception' && 'Grant Exception'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}