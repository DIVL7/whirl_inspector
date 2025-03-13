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
            console.log('Obteniendo todos los cursos con filtros:', filters);
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
            
            console.log('Consulta SQL:', query);
            console.log('Parámetros:', params);
            
            const courses = await conn.query(query, params);
            console.log(`Se encontraron ${courses.length} cursos`);
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
            console.log(`Buscando curso con ID: ${id}`);
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
            
            console.log('Consulta SQL para curso:', courseQuery);
            const courses = await conn.query(courseQuery, [id]);
            
            if (courses.length === 0) {
                console.log(`No se encontró el curso con ID: ${id}`);
                return null;
            }
            
            const course = courses[0];
            console.log(`Curso encontrado: ${course.title}`);
            
            // Obtener módulos del curso
            const modulesQuery = `
                SELECT *
                FROM course_modules
                WHERE course_id = ?
                ORDER BY order_number ASC
            `;
            
            course.modules = await conn.query(modulesQuery, [id]);
            console.log(`Se encontraron ${course.modules.length} módulos para el curso`);
            
            // Para cada módulo, obtener sus lecciones
            for (const module of course.modules) {
                const lessonsQuery = `
                    SELECT *
                    FROM module_lessons
                    WHERE module_id = ?
                    ORDER BY order_number ASC
                `;
                
                module.lessons = await conn.query(lessonsQuery, [module.id]);
                console.log(`Módulo ${module.id}: ${module.lessons.length} lecciones`);
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
            console.log('Creando nuevo curso con datos:', courseData);
            conn = await pool.getConnection();
            
            // Iniciar transacción
            await conn.beginTransaction();
            
            // Imprimir información sobre la conexión a la BD
            console.log('Conexión a BD establecida para crear curso');
            
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
                courseData.is_active ? 1 : 0,
                courseData.created_by
            ];
            
            console.log('Consulta SQL:', query);
            console.log('Parámetros:', params);
            
            try {
                const result = await conn.query(query, params);
                const courseId = result.insertId;
                
                // Confirmar transacción
                await conn.commit();
                
                console.log(`Curso creado con ID: ${courseId}`);
                return { id: courseId, ...courseData };
            } catch (insertError) {
                // Revertir transacción en caso de error en la inserción
                await conn.rollback();
                console.error('Error al insertar curso:', insertError);
                throw insertError;
            }
        } catch (err) {
            console.error('Error general al crear curso:', err);
            if (err.code) {
                console.error('Código de error SQL:', err.code);
            }
            if (err.sqlMessage) {
                console.error('Mensaje de error SQL:', err.sqlMessage);
            }
            if (err.sql) {
                console.error('SQL ejecutado:', err.sql);
            }
            throw err;
        } finally {
            if (conn) {
                try {
                    conn.release();
                    console.log('Conexión liberada');
                } catch (releaseError) {
                    console.error('Error al liberar la conexión:', releaseError);
                }
            }
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
            console.log(`Actualizando curso ID ${id} con datos:`, courseData);
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
                courseData.is_active ? 1 : 0,
                id
            ];
            
            console.log('Consulta SQL:', query);
            console.log('Parámetros:', params);
            
            const result = await conn.query(query, params);
            
            // Confirmar transacción
            await conn.commit();
            
            console.log(`Curso actualizado, filas afectadas: ${result.affectedRows}`);
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
            console.log(`Eliminando curso ID: ${id}`);
            conn = await pool.getConnection();
            
            // Iniciar transacción
            await conn.beginTransaction();
            
            // Eliminar el curso (las claves foráneas se encargarán de eliminar los módulos y lecciones)
            const query = `DELETE FROM courses WHERE id = ?`;
            const result = await conn.query(query, [id]);
            
            // Confirmar transacción
            await conn.commit();
            
            console.log(`Curso eliminado, filas afectadas: ${result.affectedRows}`);
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
            console.log('Obteniendo todas las categorías de cursos');
            conn = await pool.getConnection();
            
            const query = `SELECT * FROM course_categories ORDER BY name ASC`;
            const categories = await conn.query(query);
            
            console.log(`Se encontraron ${categories.length} categorías`);
            return categories;
        } catch (err) {
            console.error('Error al obtener categorías:', err);
            throw err;
        } finally {
            if (conn) conn.release();
        }
    }
}

module.exports = Course;