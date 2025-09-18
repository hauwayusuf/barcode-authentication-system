import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables - using demo mode')
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
}) : null

// Database types
export interface Department {
  id: string
  name: string
  created_at: string
}

export interface Course {
  id: string
  name: string
  code: string
  department_id: string
  lecturer_id?: string
  created_at: string
}

export interface Level {
  id: string
  name: string
  course_id?: string
  created_at: string
}

export interface Student {
  id: string
  name: string
  student_id: string
  email: string
  password: string
  department_id?: string
  course_id?: string
  level_id?: string
  gpa?: number
  can_change_password?: boolean
  created_at: string
}

export interface Lecturer {
  id: string
  name: string
  lecturer_id: string
  email: string
  password: string
  department_id?: string
  created_at: string
}

export interface StudentCourse {
  id: string
  student_id: string
  course_id: string
  attendance_score: number
  attendance_percentage: number
  can_print: boolean
  has_exception: boolean
  created_at: string
}

export interface ActivityLog {
  id: string
  user_id?: string
  action: string
  details?: string
  ip_address?: string
  created_at: string
}

export interface User {
  id: string
  name: string
  email: string
  password: string
  role: string
  created_at: string
}