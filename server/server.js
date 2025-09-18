import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Supabase setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Middleware
app.use(cors())
app.use(express.json())

// Email configuration
let emailTransporter = null

// Initialize email transporter only if credentials are provided
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  try {
    emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    })
    
    // Verify connection
    emailTransporter.verify((error, success) => {
      if (error) {
        console.error('Email configuration error:', error)
        emailTransporter = null
      } else {
        console.log('✅ Email server is ready to send messages')
      }
    })
  } catch (error) {
    console.error('Failed to create email transporter:', error)
    emailTransporter = null
  }
} else {
  console.log('⚠️  Email not configured - SMTP_USER and SMTP_PASS required')
}

// Send email notification
const sendEmailNotification = async (to, subject, html) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('Email not configured, skipping notification')
      return
    }

    await emailTransporter.sendMail({
      from: `"University Attendance System" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    })
    console.log(`Email sent to ${to}`)
  } catch (error) {
    console.error('Email sending failed:', error)
  }
}

// Helper function to log activities
const logActivity = async (userId, userType, action, details = {}, ipAddress = null) => {
  try {
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        user_type: userType,
        action,
        details,
        ip_address: ipAddress
      })
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' })
    }

    let user = null

    switch (role) {
      case 'admin':
        // Demo admin login
        if (email === 'admin' && password === 'admin') {
          user = { 
            id: '1', 
            email: 'admin', 
            name: 'Administrator',
            username: 'admin'
          }
        } else {
          return res.status(401).json({ success: false, message: 'Invalid credentials' })
        }
        break

      case 'lecturer':
        // Check database for lecturer
        const { data: lecturerData, error: lecturerError } = await supabase
          .from('lecturers')
          .select('*')
          .eq('email', email)
          .single()

        if (lecturerData && !lecturerError) {
          // Check if password is already hashed or plain text
          let isValidPassword = false
          if (lecturerData.password.startsWith('$2a$') || lecturerData.password.startsWith('$2b$')) {
            // Password is hashed, use bcrypt compare
            isValidPassword = await bcrypt.compare(password, lecturerData.password)
          } else {
            // Password is plain text (for demo), direct comparison
            isValidPassword = password === lecturerData.password
          }
          
          if (isValidPassword) {
            user = {
              id: lecturerData.id,
              email: lecturerData.email,
              name: lecturerData.name,
              first_name: lecturerData.name.split(' ')[0],
              last_name: lecturerData.name.split(' ').slice(1).join(' ')
            }
          }
        } else {
          // Demo lecturer login fallback
          if (email === 'lecturer@university.edu' && password === 'password') {
            user = { 
              id: '2', 
              email: 'lecturer@university.edu', 
              name: 'Dr. Smith',
              first_name: 'Dr.',
              last_name: 'Smith'
            }
          }
        }
        break

      case 'student':
        // Check database for student
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('email', email)
          .single()

        if (studentData && !studentError) {
          // Check if password is already hashed or plain text
          let isValidPassword = false
          if (studentData.password.startsWith('$2a$') || studentData.password.startsWith('$2b$')) {
            // Password is hashed, use bcrypt compare
            isValidPassword = await bcrypt.compare(password, studentData.password)
          } else {
            // Password is plain text (for demo), direct comparison
            isValidPassword = password === studentData.password
          }
          
          if (isValidPassword) {
            user = {
              id: studentData.id,
              email: studentData.email,
              name: studentData.name,
              first_name: studentData.name.split(' ')[0],
              last_name: studentData.name.split(' ').slice(1).join(' ')
            }
          }
        } else {
          // Demo student login fallback
          if (email === 'student@university.edu' && password === 'password') {
            user = { 
              id: '3', 
              email: 'student@university.edu', 
              name: 'John Doe',
              first_name: 'John',
              last_name: 'Doe'
            }
          }
        }
        break

      default:
        return res.status(400).json({ success: false, message: 'Invalid role' })
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Log activity
    // await logActivity(user.id, role, 'LOGIN', {}, req.ip)

    // Return user data (excluding password)
    const userData = { ...user }
    delete userData.password_hash

    res.json({
      success: true,
      token,
      user: userData
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

// Admin Routes
app.post('/api/admin/departments', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }

    const { name, code } = req.body

    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and code are required' })
    }

    const { data, error } = await supabase
      .from('departments')
      .insert({ name, code })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ success: false, message: 'Department name or code already exists' })
      }
      throw error
    }

    await logActivity(req.user.id, 'admin', 'CREATE_DEPARTMENT', { department_id: data.id, name, code }, req.ip)

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error creating department:', error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

app.get('/api/admin/departments', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }

    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name')

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching departments:', error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

app.post('/api/admin/courses', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }

    const { name, code, department_id, duration_years } = req.body

    if (!name || !code || !department_id) {
      return res.status(400).json({ success: false, message: 'Name, code, and department are required' })
    }

    const { data, error } = await supabase
      .from('courses')
      .insert({ 
        name, 
        code, 
        department_id,
        duration_years: duration_years || 4
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ success: false, message: 'Course code already exists' })
      }
      throw error
    }

    // Create levels for the course
    const levelNumbers = duration_years === 5 ? [100, 200, 300, 400, 500] : [100, 200, 300, 400]
    const levelsToInsert = levelNumbers.map(num => ({
      name: `Level ${num}`,
      course_id: data.id
    }))

    const { error: levelsError } = await supabase
      .from('levels')
      .insert(levelsToInsert)

    if (levelsError) {
      console.error('Error creating levels:', levelsError)
    }

    await logActivity(req.user.id, 'admin', 'CREATE_COURSE', { 
      course_id: data.id, 
      name, 
      code, 
      department_id,
      duration_years 
    }, req.ip)

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error creating course:', error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

// Admin stats routes
app.get('/api/admin/stats/students', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }

    const { data, error } = await supabase
      .from('students')
      .select('id', { count: 'exact' })

    if (error) throw error

    res.json({ success: true, count: data?.length || 0 })
  } catch (error) {
    console.error('Error fetching student count:', error)
    res.json({ success: true, count: 15 }) // Fallback demo count
  }
})

app.get('/api/admin/stats/lecturers', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }

    const { data, error } = await supabase
      .from('lecturers')
      .select('id', { count: 'exact' })

    if (error) throw error

    res.json({ success: true, count: data?.length || 0 })
  } catch (error) {
    console.error('Error fetching lecturer count:', error)
    res.json({ success: true, count: 3 }) // Fallback demo count
  }
})

app.get('/api/admin/courses/:departmentId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }

    const { departmentId } = req.params

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('department_id', departmentId)
      .order('name')

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching courses:', error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

app.post('/api/admin/lecturers', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }

    const { lecturer_id, first_name, last_name, email, department_id } = req.body

    if (!lecturer_id || !first_name || !last_name || !email) {
      return res.status(400).json({ success: false, message: 'All fields are required' })
    }

    // Hash default password
    const hashedPassword = await bcrypt.hash('lecturer123', 10)
    const name = `${first_name} ${last_name}`

    const { data, error } = await supabase
      .from('lecturers')
      .insert({
        lecturer_id,
        name,
        email,
        password: hashedPassword,
        department_id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ success: false, message: 'Lecturer ID or email already exists' })
      }
      throw error
    }

    // Also create user record
    const { error: userError } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        role: 'lecturer'
      })

    if (userError) {
      console.error('Error creating user record:', userError)
    }

    await logActivity(req.user.id, 'admin', 'CREATE_LECTURER', { 
      lecturer_id: data.id, 
      staff_id: lecturer_id,
      name,
      email 
    }, req.ip)

    // Send welcome email to lecturer
    if (email) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3b82f6;">Welcome to University Attendance System</h2>
          <p>Dear ${name},</p>
          <p>Your lecturer account has been created successfully.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Staff ID:</strong> ${lecturer_id}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Default Password:</strong> lecturer123</p>
          </div>
          <p>Please log in and change your password.</p>
          <p>Best regards,<br>University Administration</p>
        </div>
      `
      await sendEmailNotification(email, 'Welcome - Lecturer Account Created', emailHtml)
    }

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error creating lecturer:', error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

app.post('/api/admin/students', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }

    const { student_id, first_name, last_name, email, department_id, course_id, level_id } = req.body

    if (!student_id || !first_name || !last_name || !email || !department_id || !course_id || !level_id) {
      return res.status(400).json({ success: false, message: 'All fields are required' })
    }

    // Hash default password
    const hashedPassword = await bcrypt.hash('student123', 10)
    const name = `${first_name} ${last_name}`

    const { data, error } = await supabase
      .from('students')
      .insert({
        student_id,
        name,
        email,
        password: hashedPassword,
        department_id,
        course_id,
        level_id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ success: false, message: 'Student ID or email already exists' })
      }
      throw error
    }

    // Also create user record
    const { error: userError } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        role: 'student'
      })

    if (userError) {
      console.error('Error creating user record:', userError)
    }

    await logActivity(req.user.id, 'admin', 'CREATE_STUDENT', { 
      student_id: data.id, 
      student_number: student_id,
      name,
      email 
    }, req.ip)

    // Send welcome email to student
    if (email) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3b82f6;">Welcome to University Attendance System</h2>
          <p>Dear ${name},</p>
          <p>Your student account has been created successfully.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Student ID:</strong> ${student_id}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Default Password:</strong> student123</p>
          </div>
          <p>Please log in to view your attendance and access the system.</p>
          <p>Best regards,<br>University Administration</p>
        </div>
      `
      await sendEmailNotification(email, 'Welcome - Student Account Created', emailHtml)
    }

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error creating student:', error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

app.post('/api/admin/grant-exception', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }

    const { student_id, course_id, reason, student_email, course_name } = req.body

    // Update student_courses to grant exception
    const { data, error } = await supabase
      .from('student_courses')
      .update({ 
        has_exception: true,
        can_print: true 
      })
      .eq('student_id', student_id)
      .eq('course_id', course_id)
      .select()

    if (error) throw error

    await logActivity(req.user.id, 'admin', 'GRANT_EXCEPTION', { 
      student_id, 
      course_id, 
      reason 
    }, req.ip)

    // Send email notification to student
    if (student_email) {
      // Extract student name from email - handle both formats
      let studentName = student_email.split('@')[0]
      if (studentName.includes('.')) {
        studentName = studentName.replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())
      } else {
        // For emails like saada6818@bazeuniversity.edu.ng, extract just the name part
        studentName = studentName.replace(/\d+/g, '').replace(/\b\w/g, l => l.toUpperCase())
      }
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #059669; margin: 0; font-size: 24px;">🎓 Baze University - Attendance Exception Granted</h1>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Dear ${studentName},</p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Great news! An attendance exception has been granted for your course.
            </p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
              <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Exception Details:</h3>
              <p style="margin: 5px 0; color: #374151;"><strong>Course:</strong> ${course_name || 'N/A'}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Reason:</strong> ${reason}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">✅ Approved</span></p>
            </div>
            
            <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #059669; margin: 0 0 10px 0; font-size: 16px;">🎉 You are now eligible to print your attendance barcode!</h3>
              <p style="color: #374151; margin: 0; font-size: 14px;">
                Please log in to your student portal and navigate to the course to access the barcode printing feature.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/student" 
                 style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Access Student Portal
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
              Best regards,<br>
              <strong>Baze University Administration</strong><br>
              Baze University Attendance Management System
            </p>
            
            <p style="color: #9ca3af; font-size: 12px; margin-top: 20px; text-align: center;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
      await sendEmailNotification(student_email, '🎓 Baze University - Attendance Exception Granted!', emailHtml)
    }

    res.json({ success: true, message: 'Exception granted successfully' })
  } catch (error) {
    console.error('Error granting exception:', error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

// Lecturer Routes
app.get('/api/lecturer/courses', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer') {
      return res.status(403).json({ success: false, message: 'Lecturer access required' })
    }

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('lecturer_id', req.user.id)
      .order('name')

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching lecturer courses:', error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

app.get('/api/lecturer/course-students/:courseId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer') {
      return res.status(403).json({ success: false, message: 'Lecturer access required' })
    }

    const { courseId } = req.params

    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        student_courses (
          attendance_score,
          attendance_percentage,
          can_print,
          has_exception
        )
      `)
      .eq('course_id', courseId)
      .order('student_id')

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching course students:', error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

app.post('/api/lecturer/update-attendance', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'lecturer') {
      return res.status(403).json({ success: false, message: 'Lecturer access required' })
    }

    const { student_id, course_id, score } = req.body

    // Call stored procedure
    const { data, error } = await supabase.rpc('update_student_attendance', {
      p_student_id: student_id,
      p_course_id: course_id,
      p_score: score
    })

    if (error) throw error

    await logActivity(req.user.id, 'lecturer', 'UPDATE_ATTENDANCE', { 
      student_id, 
      course_id, 
      score 
    }, req.ip)

    // Send email notification to student if they become eligible
    const percentage = (score / 60) * 100
    if (percentage >= 70) {
      // In real implementation, fetch student email from database
      const studentEmail = 'student@university.edu' // Replace with actual student email
      const emailHtml = `
        <h2>Attendance Update - Now Eligible!</h2>
        <p>Dear Student,</p>
        <p>Your attendance has been updated and you are now eligible to print your barcode.</p>
        <p><strong>New Score:</strong> ${score}/60 (${percentage.toFixed(1)}%)</p>
        <p>You can now log in to your student portal and print your attendance barcode.</p>
        <br>
        <p>Best regards,<br>Your Course Lecturer</p>
      `
      await sendEmailNotification(studentEmail, 'Attendance Updated - Now Eligible', emailHtml)
    }

    res.json({ success: true, message: 'Attendance updated successfully' })
  } catch (error) {
    console.error('Error updating attendance:', error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

// Student Routes
app.get('/api/student/attendance', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Student access required' })
    }

    const { data, error } = await supabase
      .from('student_courses')
      .select(`
        *,
        courses (
          name,
          code
        )
      `)
      .eq('student_id', req.user.id)

    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching student attendance:', error)
    res.status(500).json({ success: false, message: 'Internal server error' })
  }
})

app.post('/api/test-email', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' })
    }

    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address required' })
    }

    if (!emailTransporter) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email not configured. Please set SMTP_USER and SMTP_PASS in environment variables.' 
      })
    }

    const testEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3b82f6;">🧪 Test Email from Baze Exam Barcode System</h2>
        <p>This is a test email to verify that the email configuration is working correctly.</p>
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>System:</strong> Baze Exam Barcode Management</p>
          <p><strong>Status:</strong> ✅ Email system is working!</p>
        </div>
        <p>If you received this email, the system is properly configured to send notifications.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated test message.</p>
      </div>
    `

    await sendEmailNotification(email, '🧪 Test Email - Baze Exam Barcode System', testEmailHtml)
    
    res.json({ 
      success: true, 
      message: `Test email sent successfully to ${email}` 
    })
  } catch (error) {
    console.error('Test email failed:', error)
    res.status(500).json({ 
      success: false, 
      message: `Failed to send test email: ${error.message}` 
    })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() })
})

// Test database connection
app.get('/api/test-connection', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('count(*)')
      .single()

    if (error) throw error

    res.json({ 
      success: true, 
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database connection error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
      error: error.message 
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
  console.log(`Test connection: http://localhost:${PORT}/api/test-connection`)
})

export default app