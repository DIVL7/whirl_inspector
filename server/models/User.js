/**
 * Modelo de Usuario
 * 
 * Maneja todas las operaciones de base de datos relacionadas con usuarios
 */

const { pool } = require('../config/db');

class User {
    /**
     * Obtener un usuario por su ID
     * 
     * @param {number} id - ID del usuario
     * @returns {Promise<Object>} Datos del usuario
     */
    static async getById(id) {
        let conn;
        try {
            conn = await pool.getConnection();
            
            const query = `
                SELECT u.id, u.employee_number, u.first_name, u.last_name, 
                       u.email, r.name as role, u.is_active, u.last_login,
                       u.created_at, u.updated_at
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = ?
            `;
            
            const rows = await conn.query(query, [id]);
            
            if (rows.length === 0) {
                return null;
            }
            
            return rows[0];
        } catch (err) {
            console.error('Error al obtener usuario por ID:', err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }
    
    /**
     * Obtener un usuario por su número de empleado
     * 
     * @param {string} employeeNumber - Número de empleado
     * @returns {Promise<Object>} Datos del usuario
     */
    static async getByEmployeeNumber(employeeNumber) {
        let conn;
        try {
            conn = await pool.getConnection();
            
            const query = `
                SELECT u.id, u.employee_number, u.first_name, u.last_name, 
                       u.email, r.name as role, u.is_active, u.last_login,
                       u.created_at, u.updated_at
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.employee_number = ?
            `;
            
            const rows = await conn.query(query, [employeeNumber]);
            
            if (rows.length === 0) {
                return null;
            }
            
            return rows[0];
        } catch (err) {
            console.error('Error al obtener usuario por número de empleado:', err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }
    
    /**
     * Verificar las credenciales de un usuario
     * 
     * @param {string} employeeNumber - Número de empleado
     * @param {string} password - Contraseña
     * @returns {Promise<Object>} Datos del usuario si las credenciales son correctas
     */
    static async verifyCredentials(employeeNumber, password) {
        let conn;
        try {
            conn = await pool.getConnection();
            
            const query = `
                SELECT u.id, u.employee_number, u.first_name, u.last_name, 
                       u.email, r.name as role, u.is_active
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.employee_number = ? AND u.password = ? AND u.is_active = 1
            `;
            
            const rows = await conn.query(query, [employeeNumber, password]);
            
            if (rows.length === 0) {
                return null;
            }
            
            // Actualizar último inicio de sesión
            await conn.query(
                'UPDATE users SET last_login = NOW() WHERE id = ?',
                [rows[0].id]
            );
            
            return rows[0];
        } catch (err) {
            console.error('Error al verificar credenciales:', err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }
    
    /**
     * Obtener los cursos en los que está inscrito un usuario
     * 
     * @param {number} userId - ID del usuario
     * @returns {Promise<Array>} Lista de cursos inscritos
     */
    static async getEnrolledCourses(userId) {
        let conn;
        try {
            conn = await pool.getConnection();
            
            const query = `
                SELECT c.id, c.title, c.description, cc.name as category_name,
                       ce.progress_percentage, ce.is_completed, ce.enrollment_date,
                       ce.completion_date
                FROM course_enrollments ce
                JOIN courses c ON ce.course_id = c.id
                LEFT JOIN course_categories cc ON c.category_id = cc.id
                WHERE ce.user_id = ?
                ORDER BY ce.enrollment_date DESC
            `;
            
            return await conn.query(query, [userId]);
        } catch (err) {
            console.error('Error al obtener cursos inscritos:', err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }
}

module.exports = User;