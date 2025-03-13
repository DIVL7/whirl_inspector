-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS whirl_inspector;

-- Use the database
USE whirl_inspector;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create users table with employee_number as unique identifier
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_number VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
('admin', 'Administrator with full access'),
('user', 'Regular technician user');

-- Insert a default admin user (password: admin1234)
INSERT INTO users (employee_number, password, first_name, last_name, email, role_id) VALUES 
('A12345', 'admin1234', 'Luis', 'Diaz', 'admin@whirlinspector.com', 1);

-- Insert a default regular user (password: user1234)
INSERT INTO users (employee_number, password, first_name, last_name, email, role_id) VALUES 
('T67890', 'user1234', 'Isaac', 'Valle', 'tech@whirlinspector.com', 2);

-- Tabla de categorías de cursos
CREATE TABLE IF NOT EXISTS course_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de cursos
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT,
    duration_hours INT NOT NULL DEFAULT 0,
    rating DECIMAL(3,1) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES course_categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Tabla de módulos de curso
CREATE TABLE IF NOT EXISTS course_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_number INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Tabla de lecciones dentro de módulos
CREATE TABLE IF NOT EXISTS module_lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    order_number INT NOT NULL DEFAULT 0,
    duration_minutes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE
);

-- Tabla de inscripciones de usuarios a cursos
CREATE TABLE IF NOT EXISTS course_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_enrollment (user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Insertar categorías de cursos predeterminadas
INSERT INTO course_categories (name, description) VALUES
('Técnica', 'Cursos de diagnóstico y conocimientos técnicos'),
('Reparación', 'Cursos enfocados en reparación de electrodomésticos'),
('Instalación', 'Cursos sobre instalación correcta de productos'),
('Mantenimiento', 'Cursos de mantenimiento preventivo y correctivo');

-- Insertar cursos de ejemplo
INSERT INTO courses (title, description, category_id, duration_hours, rating, created_by) VALUES
('Diagnóstico de Lavadoras Whirlpool', 'Curso completo de diagnóstico y solución de problemas comunes en lavadoras Whirlpool.', 1, 20, 4.8, 1),
('Reparación de Refrigeradores', 'Guía completa para la reparación de unidades de refrigeración Whirlpool.', 2, 18, 4.7, 1),
('Instalación Profesional de Lavaplatos', 'Procedimientos correctos para instalaciones perfectas de lavaplatos Whirlpool.', 3, 12, 4.5, 1);

-- Insertar módulos de ejemplo para el curso "Diagnóstico de Lavadoras Whirlpool"
INSERT INTO course_modules (course_id, title, description, order_number) VALUES
(1, 'Introducción al diagnóstico', 'Fundamentos del diagnóstico de lavadoras', 1),
(1, 'Herramientas necesarias', 'Herramientas y equipos para diagnóstico efectivo', 2),
(1, 'Problemas comunes', 'Identificación y solución de problemas frecuentes', 3);

-- Insertar lecciones de ejemplo para el módulo "Introducción al diagnóstico"
INSERT INTO module_lessons (module_id, title, content, order_number, duration_minutes) VALUES
(1, 'Principios básicos', 'Contenido sobre principios básicos de diagnóstico', 1, 20),
(1, 'Seguridad eléctrica', 'Procedimientos de seguridad al diagnosticar lavadoras', 2, 15),
(1, 'Lectura de manuales técnicos', 'Cómo interpretar correctamente los manuales técnicos', 3, 25);

-- Insertar inscripciones de ejemplo
INSERT INTO course_enrollments (user_id, course_id, progress_percentage) VALUES
(2, 1, 65.00),  -- Usuario técnico inscrito en "Diagnóstico de Lavadoras Whirlpool"
(2, 2, 80.00),  -- Usuario técnico inscrito en "Reparación de Refrigeradores"
(2, 3, 100.00); -- Usuario técnico inscrito en "Instalación Profesional de Lavaplatos" (completado)

-- Actualizar el curso completado
UPDATE course_enrollments 
SET is_completed = TRUE, completion_date = NOW() 
WHERE user_id = 2 AND course_id = 3;