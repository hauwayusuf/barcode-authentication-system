import React, { useState, useEffect } from 'react'
import { Layout } from '../components/Layout'
import { BookOpen, CheckCircle, XCircle, Printer, Fingerprint, Award } from 'lucide-react'
import JsBarcode from 'jsbarcode'

interface CourseAttendance {
  id: string
  course_name: string
  course_code: string
  attendance_score: number
  attendance_percentage: number
  can_print: boolean
  has_exception: boolean
}

export const StudentDashboard: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<CourseAttendance[]>([])
  const [showFingerprintModal, setShowFingerprintModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<CourseAttendance | null>(null)
  const [fingerprintStep, setFingerprintStep] = useState<'place' | 'verifying' | 'success' | 'error'>('place')
  const [fingerprintDevice, setFingerprintDevice] = useState<any>(null)
  const [isRealDevice, setIsRealDevice] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAttendanceData()

    // Check for real fingerprint scanner
    checkFingerprintDevice()
  }, [])

  const loadAttendanceData = async () => {
    setLoading(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL
      if (apiUrl) {
        const response = await fetch(`${apiUrl}/student/attendance`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const attendanceData = data.data.map((item: any) => ({
              id: item.id,
              course_name: item.courses?.name || 'Unknown Course',
              course_code: item.courses?.code || 'N/A',
              attendance_score: item.attendance_score,
              attendance_percentage: item.attendance_percentage,
              can_print: item.can_print || item.has_exception,
              has_exception: item.has_exception
            }))
            setAttendanceData(attendanceData)
            setLoading(false)
            return
          }
        }
      }
      
      // Fallback to demo data
      setAttendanceData([
        // Real Baze University students
        {
          id: '1',
          course_name: 'Computer Science',
          course_code: 'CS401',
          attendance_score: 39,
          attendance_percentage: 65.0,
          can_print: false,
          has_exception: false
        },
        {
          id: '2',
          course_name: 'Information Technology', 
          course_code: 'IT401',
          attendance_score: 38,
          attendance_percentage: 63.3,
          can_print: false,
          has_exception: false
        },
        {
          id: '3',
          course_name: 'Information Systems Management',
          course_code: 'ISM401', 
          attendance_score: 36,
          attendance_percentage: 60.0,
          can_print: false,
          has_exception: false
        },
        // Demo data
        {
          id: '4',
          course_name: 'Software Engineering',
          course_code: 'CS301',
          attendance_score: 45,
          attendance_percentage: 75.0,
          can_print: true,
          has_exception: false
        },
        {
          id: '5',
          course_name: 'Database Systems',
          course_code: 'CS302',
          attendance_score: 38,
          attendance_percentage: 63.3,
          can_print: false,
          has_exception: false
        },
        {
          id: '6',
          course_name: 'Computer Networks',
          course_code: 'CS401',
          attendance_score: 42,
          attendance_percentage: 70.0,
          can_print: true,
          has_exception: false
        },
        {
          id: '7',
          course_name: 'Data Structures',
          course_code: 'CS201',
          attendance_score: 35,
          attendance_percentage: 58.3,
          can_print: true,
          has_exception: true
        }
      ])
    } catch (error) {
      console.error('Error loading attendance data:', error)
      // Use demo data as fallback
      setAttendanceData([
        {
          id: '1',
          course_name: 'Computer Science',
          course_code: 'CS401',
          attendance_score: 39,
          attendance_percentage: 65.0,
          can_print: false,
          has_exception: false
        },
        {
          id: '2',
          course_name: 'Information Technology', 
          course_code: 'IT401',
          attendance_score: 38,
          attendance_percentage: 63.3,
          can_print: false,
          has_exception: false
        },
        {
          id: '3',
          course_name: 'Information Systems Management',
          course_code: 'ISM401', 
          attendance_score: 36,
          attendance_percentage: 60.0,
          can_print: false,
          has_exception: false
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const checkFingerprintDevice = async () => {
    try {
      // Check if WebAuthn is supported (for real biometric authentication)
      // Force simulation mode to avoid browser security restrictions
      setIsRealDevice(false)
      console.log('Using simulated fingerprint scanner')
    } catch (error) {
      console.log('Fingerprint detection failed, using simulation')
    }
  }

  const handlePrintBarcode = (course: CourseAttendance) => {
    setSelectedCourse(course)
    setShowFingerprintModal(true)
    setFingerprintStep('place')
  }

  const simulateFingerprint = async () => {
    setFingerprintStep('verifying')
    
    if (isRealDevice) {
      try {
        // Use real WebAuthn biometric authentication
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: new Uint8Array(32),
            rp: { name: "University Attendance System" },
            user: {
              id: new Uint8Array(16),
              name: "student@university.edu",
              displayName: "Student"
            },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }],
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required"
            },
            timeout: 60000,
            attestation: "direct"
          }
        })

        if (credential) {
          setFingerprintStep('success')
          setTimeout(() => {
            // Refresh attendance data to get updated can_print status
            loadAttendanceData()
            
            // Generate barcode
            generateAndPrintBarcode()
            setShowFingerprintModal(false)
          }, 1500)
        }
      } catch (error) {
        console.error('Biometric authentication failed:', error)
        setFingerprintStep('error')
        setTimeout(() => {
          setFingerprintStep('place')
        }, 2000)
      }
    } else {
      // Fallback to simulation
      setTimeout(() => {
        // Simulate successful verification (90% success rate)
        if (Math.random() > 0.1) {
          setFingerprintStep('success')
          setTimeout(() => {
            // Refresh attendance data
            loadAttendanceData()
            
            generateAndPrintBarcode()
            setShowFingerprintModal(false)
          }, 1500)
        } else {
          setFingerprintStep('error')
          setTimeout(() => {
            setFingerprintStep('place')
          }, 2000)
        }
      }, 2000)
    }
  }

  const generateAndPrintBarcode = () => {
    if (!selectedCourse) return

    // Generate a proper barcode with student info
    const studentId = localStorage.getItem('student_id') || 'STU2024001'
    const timestamp = new Date().toISOString().split('T')[0]
    const barcodeData = `${studentId}-${selectedCourse.course_code}-${selectedCourse.attendance_percentage.toFixed(1)}-${timestamp}`
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=600,height=400')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Barcode - ${selectedCourse.course_code}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 10px;
              margin: 0;
              background: white;
            }
            .barcode-container {
              border: 2px solid #000;
              padding: 15px;
              margin: 10px auto;
              width: fit-content;
              max-width: 4in;
              background: white;
              page-break-inside: avoid;
            }
            .barcode-only {
              border: none;
              padding: 5px;
              margin: 0;
              background: white;
            }
            .header {
              margin-bottom: 10px;
              font-size: 12px;
            }
            .course-info {
              margin: 8px 0;
              font-size: 10px;
            }
            .attendance-info {
              margin: 5px 0;
              font-weight: bold;
              font-size: 10px;
              color: ${selectedCourse.attendance_percentage >= 70 ? '#059669' : '#DC2626'};
            }
            #barcode {
              margin: 10px 0;
              min-height: 60px;
            }
            .barcode-text {
              font-family: 'Courier New', monospace;
              font-size: 8px;
              margin: 5px 0;
              word-break: break-all;
            }
            .footer {
              margin-top: 10px;
              font-size: 8px;
              color: #666;
            }
            .print-buttons {
              margin: 15px 0;
              display: flex;
              gap: 10px;
              justify-content: center;
            }
            .print-btn {
              padding: 8px 16px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            }
            .primary-btn {
              background: #3B82F6;
              color: white;
            }
            .secondary-btn {
              background: #6B7280;
              color: white;
            }
            .barcode-btn {
              background: #059669;
              color: white;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
              .barcode-container { 
                border: 2px solid #000; 
                box-shadow: none;
                margin: 0;
                padding: 10px;
              }
              .barcode-only {
                border: none;
                padding: 0;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            <div class="header">
              <h3>Baze University Exam Barcode</h3>
              <div class="course-info">
                <strong>${selectedCourse.course_name}</strong><br>
                Course Code: ${selectedCourse.course_code}
              </div>
            </div>
            <div class="attendance-info">
              Attendance: ${selectedCourse.attendance_score}/60 (${selectedCourse.attendance_percentage.toFixed(1)}%)
              ${selectedCourse.has_exception ? '<br><span style="color: #F59E0B;">⭐ Special Exception Granted</span>' : ''}
            </div>
            <svg id="barcode"></svg>
            <div class="barcode-text">${barcodeData}</div>
            <div class="footer">
              Student ID: ${studentId}<br>
              Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}<br>
              Verification Code: ${Math.random().toString(36).substr(2, 9).toUpperCase()}
            </div>
          </div>
          <div class="no-print print-buttons">
            <button onclick="printFull()" class="print-btn primary-btn">Print Full</button>
            <button onclick="printBarcodeOnly()" class="print-btn barcode-btn">Print Barcode Only</button>
            <button onclick="window.close()" class="print-btn secondary-btn">Close</button>
          </div>
          
          <!-- Barcode Only Version (Hidden) -->
          <div id="barcode-only-version" style="display: none;">
            <div class="barcode-only">
              <svg id="barcode-only"></svg>
              <div class="barcode-text">${barcodeData}</div>
            </div>
          </div>
          
          <script>
            // Generate barcode immediately when page loads
            function generateBarcode() {
              const svg = document.getElementById('barcode');
              if (svg && typeof JsBarcode !== 'undefined') {
                JsBarcode(svg, '${barcodeData}', {
                  format: 'CODE128',
                  width: 2,
                  height: 60,
                  displayValue: true,
                  fontSize: 12,
                  margin: 5,
                  background: "#ffffff",
                  lineColor: "#000000"
                });
              }
            }

            // Generate barcode when JsBarcode is loaded
            if (typeof JsBarcode !== 'undefined') {
              generateBarcode();
            } else {
              // Wait for JsBarcode to load
              setTimeout(generateBarcode, 500);
            }

            function printFull() {
              document.getElementById('barcode-only-version').style.display = 'none';
              document.querySelector('.barcode-container').style.display = 'block';
              window.print();
            }
            
            function printBarcodeOnly() {
              // Hide full version and show barcode only
              document.querySelector('.barcode-container').style.display = 'none';
              document.getElementById('barcode-only-version').style.display = 'block';
              
              // Generate barcode for barcode-only version
              const svg2 = document.getElementById('barcode-only');
              if (svg2 && typeof JsBarcode !== 'undefined') {
                JsBarcode(svg2, '${barcodeData}', {
                  format: 'CODE128',
                  width: 2,
                  height: 60,
                  displayValue: false,
                  margin: 0,
                  background: "#ffffff",
                  lineColor: "#000000"
                });
              }
              
              setTimeout(() => {
                window.print();
                // Restore full version after printing
                setTimeout(() => {
                  document.querySelector('.barcode-container').style.display = 'block';
                  document.getElementById('barcode-only-version').style.display = 'none';
                }, 1000);
              }, 100);
            }
          </script>
        </body>
      </html>
    `)

    printWindow.document.close()
  }

  const getStatusBadge = (course: CourseAttendance) => {
    if (course.has_exception) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          <Award className="h-3 w-3 mr-1" />
          Exception
        </span>
      )
    }
    
    if (course.can_print) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Eligible
        </span>
      )
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Not Eligible
      </span>
    )
  }

  const getFingerprintModalContent = () => {
    switch (fingerprintStep) {
      case 'place':
        return (
          <>
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-blue-100 mb-4">
                <Fingerprint className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isRealDevice ? 'Biometric Authentication' : 'Fingerprint Verification (Demo)'}
              </h3>
              <p className="text-gray-600">
                {isRealDevice 
                  ? 'Use your device\'s biometric sensor to authenticate'
                  : 'Place your finger on the scanner to verify your identity (simulated)'
                }
              </p>
            </div>
            <button
              onClick={simulateFingerprint}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isRealDevice ? 'Authenticate with Biometrics' : 'Scan Fingerprint (Demo)'}
            </button>
          </>
        )
      
      case 'verifying':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-yellow-100 mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-600 border-t-transparent"></div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Verifying...</h3>
            <p className="text-gray-600">Please keep your finger on the scanner</p>
          </div>
        )
      
      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Successful</h3>
            <p className="text-gray-600">Generating your barcode...</p>
          </div>
        )
      
      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-4">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Verification Failed</h3>
            <p className="text-gray-600">Please try again</p>
          </div>
        )
    }
  }

  return (
    <Layout title="Student Dashboard">
      <div className="space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading attendance data...</span>
          </div>
        )}
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">My Attendance</h2>
          <p className="text-gray-600">Track your attendance and print certificates when eligible</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {attendanceData.length}
              </div>
              <div className="text-sm text-gray-600">Total Courses</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {attendanceData.filter(course => course.can_print).length}
              </div>
              <div className="text-sm text-gray-600">Eligible Courses</div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {attendanceData.filter(course => course.has_exception).length}
              </div>
              <div className="text-sm text-gray-600">Special Exceptions</div>
            </div>
          </div>
        </div>

        {/* Courses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Course Attendance Details</h3>
          </div>

          <div className="divide-y divide-gray-200">
            {attendanceData.map((course) => (
              <div key={course.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
                      <div>
                        <h4 className="font-semibold text-gray-900">{course.course_name}</h4>
                        <p className="text-sm text-gray-600">{course.course_code}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Score</div>
                        <div className="font-semibold text-gray-900">{course.attendance_score}/60</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Percentage</div>
                        <div className={`font-semibold ${
                          course.attendance_percentage >= 70 ? 'text-green-600' : 
                          course.attendance_percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {course.attendance_percentage.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Status</div>
                        <div className="mt-1">{getStatusBadge(course)}</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          course.attendance_percentage >= 70 ? 'bg-green-500' : 
                          course.attendance_percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(course.attendance_percentage, 100)}%` }}
                      ></div>
                    </div>

                    {course.has_exception && (
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4">
                        <div className="flex items-center">
                          <Award className="h-4 w-4 text-yellow-600 mr-2" />
                          <span className="text-sm text-yellow-800">
                            Special exception granted - you are eligible to print barcode
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-6">
                    <button
                      onClick={() => handlePrintBarcode(course)}
                      disabled={!course.can_print}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                        course.can_print
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print Barcode
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Information Card */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
          <h3 className="font-semibold text-blue-900 mb-3">Exam Barcode Requirements</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• You need at least 70% attendance to be eligible for barcode printing</li>
            <li>• Special exceptions may be granted by administrators in exceptional circumstances</li>
            <li>• Your attendance is calculated based on classes attended out of total classes (60 max)</li>
            <li>• Barcodes are required for Baze University examinations</li>
          </ul>
        </div>
      </div>

      {/* Fingerprint Modal */}
      {showFingerprintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full">
            <div className="p-6">
              {getFingerprintModalContent()}
            </div>
            {fingerprintStep === 'place' && (
              <div className="px-6 pb-6">
                <button
                  onClick={() => setShowFingerprintModal(false)}
                  className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}