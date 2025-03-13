/**
 * Controlador de Cursos
 * 
 * Maneja las operaciones CRUD para cursos
 */

const Course = require('../models/Course');

const courseController = {
    /**
     * Obtener todos los cursos
     * 
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     */
    async getAllCourses(req, res) {
        try {
            // Extraer filtros de la consulta
            const filters = {
                category_id: req.query.category ? parseInt(req.query.category) : null,
                search: req.query.search || null,
                active: req.query.active ? req.query.active === 'true' : undefined
            };
            
            // Eliminar filtros nulos
            Object.keys(filters).forEach(key => 
                filters[key] === null && delete filters[key]
            );
            
            const courses = await Course.getAll(filters);
            
            res.status(200).json({
                success: true,
                count: courses.length,
                data: courses
            });
        } catch (error) {
            console.error('Error al obtener cursos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los cursos',
                error: error.message
            });
        }
    },
    
    /**
     * Obtener un curso por su ID
     * 
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     */
    async getCourseById(req, res) {
        try {
            const courseId = parseInt(req.params.id);
            
            if (isNaN(courseId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de curso inválido'
                });
            }
            
            const course = await Course.getById(courseId);
            
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Curso no encontrado'
                });
            }
            
            res.status(200).json({
                success: true,
                data: course
            });
        } catch (error) {
            console.error('Error al obtener curso:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el curso',
                error: error.message
            });
        }
    },
    
    /**
     * Crear un nuevo curso
     * 
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     */
    async createCourse(req, res) {
        try {
            // Validar que el usuario sea administrador
            if (!req.user || !req.user.is_admin) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para crear cursos'
                });
            }
            
            const { title, description, category_id, duration_hours, is_active } = req.body;
            
            // Validación básica
            if (!title || !description || !category_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Los campos título, descripción y categoría son obligatorios'
                });
            }
            
            // Crear el curso
            const courseData = {
                title,
                description,
                category_id: parseInt(category_id),
                duration_hours: parseInt(duration_hours || 0),
                is_active: is_active === undefined ? true : Boolean(is_active),
                created_by: req.user.id
            };
            
            const newCourse = await Course.create(courseData);
            
            res.status(201).json({
                success: true,
                message: 'Curso creado exitosamente',
                data: newCourse
            });
        } catch (error) {
            console.error('Error al crear curso:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear el curso',
                error: error.message
            });
        }
    },
    
    /**
     * Actualizar un curso existente
     * 
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     */
    async updateCourse(req, res) {
        try {
            // Validar que el usuario sea administrador
            if (!req.user || !req.user.is_admin) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para actualizar cursos'
                });
            }
            
            const courseId = parseInt(req.params.id);
            
            if (isNaN(courseId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de curso inválido'
                });
            }
            
            const { title, description, category_id, duration_hours, is_active } = req.body;
            
            // Validación básica
            if (!title || !description || !category_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Los campos título, descripción y categoría son obligatorios'
                });
            }
            
            // Verificar que el curso existe
            const existingCourse = await Course.getById(courseId);
            
            if (!existingCourse) {
                return res.status(404).json({
                    success: false,
                    message: 'Curso no encontrado'
                });
            }
            
            // Actualizar el curso
            const courseData = {
                title,
                description,
                category_id: parseInt(category_id),
                duration_hours: parseInt(duration_hours || 0),
                is_active: is_active === undefined ? true : Boolean(is_active)
            };
            
            const updated = await Course.update(courseId, courseData);
            
            if (!updated) {
                return res.status(500).json({
                    success: false,
                    message: 'No se pudo actualizar el curso'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Curso actualizado exitosamente',
                data: { id: courseId, ...courseData }
            });
        } catch (error) {
            console.error('Error al actualizar curso:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el curso',
                error: error.message
            });
        }
    },
    
    /**
     * Eliminar un curso
     * 
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     */
    async deleteCourse(req, res) {
        try {
            // Validar que el usuario sea administrador
            if (!req.user || !req.user.is_admin) {
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para eliminar cursos'
                });
            }
            
            const courseId = parseInt(req.params.id);
            
            if (isNaN(courseId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de curso inválido'
                });
            }
            
            // Verificar que el curso existe
            const existingCourse = await Course.getById(courseId);
            
            if (!existingCourse) {
                return res.status(404).json({
                    success: false,
                    message: 'Curso no encontrado'
                });
            }
            
            // Eliminar el curso
            const deleted = await Course.delete(courseId);
            
            if (!deleted) {
                return res.status(500).json({
                    success: false,
                    message: 'No se pudo eliminar el curso'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Curso eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error al eliminar curso:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar el curso',
                error: error.message
            });
        }
    },
    
    /**
     * Obtener todas las categorías de cursos
     * 
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     */
    async getAllCategories(req, res) {
        try {
            const categories = await Course.getAllCategories();
            
            res.status(200).json({
                success: true,
                count: categories.length,
                data: categories
            });
        } catch (error) {
            console.error('Error al obtener categorías:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las categorías',
                error: error.message
            });
        }
    }
};

module.exports = courseController;