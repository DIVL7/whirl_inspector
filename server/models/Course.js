/**
 * Modelo de Curso
 * 
 * Maneja todas las operaciones de base de datos relacionadas con cursos
 */

const { pool } = require('../config/db');

class Course {
    /**
     * Obtener todos los cursos con sus categorías
     * 
     * @param {Object} filters - Filtros opcionales (categoría, búsqueda, etc.)
     * @returns {Promise<Array>} Lista de cursos
     */
    static async getAll(filters = {}) {
        let conn;
        try {
            conn = await pool.getConnection();
            
            let query = `
                SELECT c.*, cc.name as category_name,
                       (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as enrolled_count
                FROM courses c
                LEFT JOIN course_categories cc ON c.category_id = cc.id
                WHERE 1=1
            `;
            
            const params = [];
            
            // Aplicar filtros si existen
            if (filters.category_id) {
                query += ' AND c.category_id = ?';
                params.push(filters.category_id);
            }
            
            if (filters.search) {
                query += ' AND (c.title LIKE ? OR c.description LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm);
            }
            
            if (filters.active !== undefined) {
                query += ' AND c.is_active = ?';
                params.push(filters.active ? 1 : 0);
            }
            
            // Ordenar resultados
            query += ' ORDER BY c.created_at DESC';
            
            const courses = await conn.query(query, params);
            return courses;
        } catch (err) {
            console.error('Error al obtener cursos:', err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }
    
    /**
     * Obtener un curso por su ID con sus módulos
     * 
     * @param {number} id - ID del curso
     * @returns {Promise<Object>} Datos del curso con sus módulos
     */
    static async getById(id) {
        let conn;
        try {
            conn = await pool.getConnection();
            
            // Obtener datos del curso
            const courseQuery = `
                SELECT c.*, cc.name as category_name,
                       u.first_name as creator_first_name, u.last_name as creator_last_name,
                       (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as enrolled_count
                FROM courses c
                LEFT JOIN course_categories cc ON c.category_id = cc.id
                LEFT JOIN users u ON c.created_by = u.id
                WHERE c.id = ?
            `;
            
            const courses = await conn.query(courseQuery, [id]);
            
            if (courses.length === 0) {
                return null;
            }
            
            const course = courses[0];
            
            // Obtener módulos del curso
            const modulesQuery = `
                SELECT *
                FROM course_modules
                WHERE course_id = ?
                ORDER BY order_number ASC
            `;
            
            course.modules = await conn.query(modulesQuery, [id]);
            
            // Para cada módulo, obtener sus lecciones
            for (const module of course.modules) {
                const lessonsQuery = `
                    SELECT *
                    FROM module_lessons
                    WHERE module_id = ?
                    ORDER BY order_number ASC
                `;
                
                module.lessons = await conn.query(lessonsQuery, [module.id]);
            }
            
            return course;
        } catch (err) {
            console.error('Error al obtener curso por ID:', err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }
    
    /**
     * Crear un nuevo curso
     * 
     * @param {Object} courseData - Datos del nuevo curso
     * @returns {Promise<Object>} Curso creado con su ID
     */
    static async create(courseData) {
        let conn;
        try {
            conn = await pool.getConnection();
            
            // Iniciar transacción
            await conn.beginTransaction();
            
            const query = `
                INSERT INTO courses (
                    title, description, category_id, duration_hours,
                    is_active, created_by
                ) VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                courseData.title,
                courseData.description,
                courseData.category_id,
                courseData.duration_hours || 0,
                courseData.is_active !== undefined ? courseData.is_active : true,
                courseData.created_by
            ];
            
            const result = await conn.query(query, params);
            const courseId = result.insertId;
            
            // Confirmar transacción
            await conn.commit();
            
            return { id: courseId, ...courseData };
        } catch (err) {
            // Revertir transacción en caso de error
            if (conn) await conn.rollback();
            console.error('Error al crear curso:', err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }
    
    /**
     * Actualizar un curso existente
     * 
     * @param {number} id - ID del curso a actualizar
     * @param {Object} courseData - Nuevos datos del curso
     * @returns {Promise<boolean>} True si se actualizó correctamente
     */
    static async update(id, courseData) {
        let conn;
        try {
            conn = await pool.getConnection();
            
            // Iniciar transacción
            await conn.beginTransaction();
            
            const query = `
                UPDATE courses
                SET title = ?, description = ?, category_id = ?,
                    duration_hours = ?, is_active = ?
                WHERE id = ?
            `;
            
            const params = [
                courseData.title,
                courseData.description,
                courseData.category_id,
                courseData.duration_hours || 0,
                courseData.is_active !== undefined ? courseData.is_active : true,
                id
            ];
            
            const result = await conn.query(query, params);
            
            // Confirmar transacción
            await conn.commit();
            
            return result.affectedRows > 0;
        } catch (err) {
            // Revertir transacción en caso de error
            if (conn) await conn.rollback();
            console.error('Error al actualizar curso:', err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }
    
    /**
     * Eliminar un curso
     * 
     * @param {number} id - ID del curso a eliminar
     * @returns {Promise<boolean>} True si se eliminó correctamente
     */
    static async delete(id) {
        let conn;
        try {
            conn = await pool.getConnection();
            
            // Iniciar transacción
            await conn.beginTransaction();
            
            // Eliminar el curso (las claves foráneas se encargarán de eliminar los módulos y lecciones)
            const query = `DELETE FROM courses WHERE id = ?`;
            const result = await conn.query(query, [id]);
            
            // Confirmar transacción
            await conn.commit();
            
            return result.affectedRows > 0;
        } catch (err) {
            // Revertir transacción en caso de error
            if (conn) await conn.rollback();
            console.error('Error al eliminar curso:', err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }
    
    /**
     * Obtener todas las categorías de cursos
     * 
     * @returns {Promise<Array>} Lista de categorías
     */
    static async getAllCategories() {
        let conn;
        try {
            conn = await pool.getConnection();
            
            const query = `SELECT * FROM course_categories ORDER BY name ASC`;
            return await conn.query(query);
        } catch (err) {
            console.error('Error al obtener categorías:', err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }
}

module.exports = Course;