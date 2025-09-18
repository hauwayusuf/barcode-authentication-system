/*
  # Add Real Baze University Students

  1. New Students
    - Saada (Computer Science, 400 Level)
    - Hauwa (Information Technology, 400 Level) 
    - Inna (Information Systems Management, 400 Level)
  
  2. Security
    - All students get default password 'student123' (hashed)
    - Proper department, course, and level associations
  
  3. Student Courses
    - Creates student_courses records for attendance tracking
    - Sets initial attendance scores below 70% (need exceptions)
*/

-- First, ensure we have the required departments
INSERT INTO departments (name) VALUES 
  ('Computer Science'),
  ('Information Technology'),
  ('Information Systems Management')
ON CONFLICT (name) DO NOTHING;

-- Get department IDs
DO $$
DECLARE
  cs_dept_id text;
  it_dept_id text;
  ism_dept_id text;
  cs_course_id text;
  it_course_id text;
  ism_course_id text;
  cs_level_id text;
  it_level_id text;
  ism_level_id text;
  saada_id text;
  hauwa_id text;
  inna_id text;
BEGIN
  -- Get department IDs
  SELECT id INTO cs_dept_id FROM departments WHERE name = 'Computer Science';
  SELECT id INTO it_dept_id FROM departments WHERE name = 'Information Technology';
  SELECT id INTO ism_dept_id FROM departments WHERE name = 'Information Systems Management';

  -- Insert courses if they don't exist
  INSERT INTO courses (name, code, department_id) VALUES 
    ('Computer Science', 'CS401', cs_dept_id),
    ('Information Technology', 'IT401', it_dept_id),
    ('Information Systems Management', 'ISM401', ism_dept_id)
  ON CONFLICT (code) DO NOTHING;

  -- Get course IDs
  SELECT id INTO cs_course_id FROM courses WHERE code = 'CS401';
  SELECT id INTO it_course_id FROM courses WHERE code = 'IT401';
  SELECT id INTO ism_course_id FROM courses WHERE code = 'ISM401';

  -- Insert levels if they don't exist
  INSERT INTO levels (name, course_id) VALUES 
    ('Level 400', cs_course_id),
    ('Level 400', it_course_id),
    ('Level 400', ism_course_id)
  ON CONFLICT DO NOTHING;

  -- Get level IDs
  SELECT id INTO cs_level_id FROM levels WHERE course_id = cs_course_id AND name = 'Level 400';
  SELECT id INTO it_level_id FROM levels WHERE course_id = it_course_id AND name = 'Level 400';
  SELECT id INTO ism_level_id FROM levels WHERE course_id = ism_course_id AND name = 'Level 400';

  -- Insert students
  INSERT INTO students (name, student_id, email, password, department_id, course_id, level_id, gpa) VALUES 
    ('Saada', 'CS2021001', 'saada6818@bazeuniversity.edu.ng', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', cs_dept_id, cs_course_id, cs_level_id, 3.20),
    ('Hauwa', 'IT2021001', 'hauwa6867@bazeuniversity.edu.ng', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', it_dept_id, it_course_id, it_level_id, 3.15),
    ('Inna', 'ISM2021001', 'inna5251@bazeuniversity.edu.ng', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', ism_dept_id, ism_course_id, ism_level_id, 3.10)
  ON CONFLICT (email) DO NOTHING;

  -- Get student IDs
  SELECT id INTO saada_id FROM students WHERE email = 'saada6818@bazeuniversity.edu.ng';
  SELECT id INTO hauwa_id FROM students WHERE email = 'hauwa6867@bazeuniversity.edu.ng';
  SELECT id INTO inna_id FROM students WHERE email = 'inna5251@bazeuniversity.edu.ng';

  -- Insert into users table for authentication
  INSERT INTO users (name, email, password, role) VALUES 
    ('Saada', 'saada6818@bazeuniversity.edu.ng', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
    ('Hauwa', 'hauwa6867@bazeuniversity.edu.ng', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student'),
    ('Inna', 'inna5251@bazeuniversity.edu.ng', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student')
  ON CONFLICT (email) DO NOTHING;

  -- Insert student course records for attendance tracking
  INSERT INTO student_courses (student_id, course_id, attendance_score, attendance_percentage, can_print, has_exception) VALUES 
    (saada_id, cs_course_id, 39, 65.0, false, false),
    (hauwa_id, it_course_id, 38, 63.3, false, false),
    (inna_id, ism_course_id, 36, 60.0, false, false)
  ON CONFLICT (student_id, course_id) DO NOTHING;

END $$;