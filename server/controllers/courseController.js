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
            // Debug de usuario
            console.log('Usuario actual:', req.user);
            
            // Extraer filtros de la consulta
            const filters = {
                category_id: req.query.category ? parseInt(req.query.category) : null,
                search: req.query.search || null,
                active: req.query.active ? req.query.active === 'true' : undefined
            };
            
            // Debug: Mostrar filtros
            console.log('Filtros de búsqueda:', filters);
            
            // Eliminar filtros nulos
            Object.keys(filters).forEach(key => 
                filters[key] === null && delete filters[key]
            );
            
            const courses = await Course.getAll(filters);
            
            // Debug: Mostrar cantidad de cursos encontrados
            console.log(`Se encontraron ${courses.length} cursos`);
            
            res.status(200).json({
                success: true,
                count: courses.length,
                data: courses
            });
        } catch (error) {
            console.error('ERROR AL OBTENER CURSOS:', error);
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
            
            // Debug: Mostrar ID solicitado
            console.log(`Buscando curso con ID: ${courseId}`);
            
            if (isNaN(courseId)) {
                console.log('ID de curso inválido:', req.params.id);
                return res.status(400).json({
                    success: false,
                    message: 'ID de curso inválido'
                });
            }
            
            const course = await Course.getById(courseId);
            
            if (!course) {
                console.log(`Curso con ID ${courseId} no encontrado`);
                return res.status(404).json({
                    success: false,
                    message: 'Curso no encontrado'
                });
            }
            
            console.log(`Curso encontrado: ${course.title}`);
            
            res.status(200).json({
                success: true,
                data: course
            });
        } catch (error) {
            console.error('ERROR AL OBTENER CURSO POR ID:', error);
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
            console.log('=== INICIO DE createCourse ===');
            console.log('Body recibido:', req.body);
            console.log('Usuario actual:', req.user);
            
            // Validar que el usuario sea administrador
            if (!req.user) {
                console.log('ERROR: No hay usuario en la solicitud');
                return res.status(403).json({
                    success: false,
                    message: 'No se pudo identificar al usuario. Inicie sesión nuevamente.'
                });
            }
            
            if (!req.user.is_admin) {
                console.log('ERROR: Usuario no es administrador');
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para crear cursos'
                });
            }
            
            const { title, description, category_id, duration_hours, is_active } = req.body;
            
            // Debug detallado de campos
            console.log('Datos del curso a crear:');
            console.log('- Título:', title);
            console.log('- Descripción:', description);
            console.log('- Categoría ID:', category_id);
            console.log('- Duración (horas):', duration_hours);
            console.log('- Activo:', is_active);
            
            // Validación básica
            if (!title) {
                console.log('ERROR: Falta el título del curso');
                return res.status(400).json({
                    success: false,
                    message: 'El título del curso es obligatorio'
                });
            }
            
            if (!description) {
                console.log('ERROR: Falta la descripción del curso');
                return res.status(400).json({
                    success: false,
                    message: 'La descripción del curso es obligatoria'
                });
            }
            
            if (!category_id) {
                console.log('ERROR: Falta la categoría del curso');
                return res.status(400).json({
                    success: false,
                    message: 'La categoría del curso es obligatoria'
                });
            }
            
            // Convertir category_id a número si es string
            let categoryId = category_id;
            if (typeof category_id === 'string') {
                categoryId = parseInt(category_id);
                if (isNaN(categoryId)) {
                    console.log('ERROR: ID de categoría no es un número válido');
                    return res.status(400).json({
                        success: false,
                        message: 'ID de categoría no válido'
                    });
                }
            }
            
            // Convertir duration_hours a número si es string
            let durationHours = duration_hours || 0;
            if (typeof duration_hours === 'string') {
                durationHours = parseInt(duration_hours);
                if (isNaN(durationHours)) {
                    durationHours = 0;
                }
            }
            
            // Crear el curso
            const courseData = {
                title,
                description,
                category_id: categoryId,
                duration_hours: durationHours,
                is_active: is_active === undefined ? true : Boolean(is_active),
                created_by: req.user.id
            };
            
            console.log('Datos finales para crear curso:', courseData);
            
            const newCourse = await Course.create(courseData);
            
            console.log('Curso creado exitosamente:', newCourse);
            console.log('=== FIN DE createCourse ===');
            
            res.status(201).json({
                success: true,
                message: 'Curso creado exitosamente',
                data: newCourse
            });
        } catch (error) {
            console.error('ERROR AL CREAR CURSO:', error);
            console.error('Stack trace:', error.stack);
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
            console.log('=== INICIO DE updateCourse ===');
            console.log('Body recibido:', req.body);
            console.log('Usuario actual:', req.user);
            
            // Validar que el usuario sea administrador
            if (!req.user || !req.user.is_admin) {
                console.log('ERROR: Usuario no es administrador');
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para actualizar cursos'
                });
            }
            
            const courseId = parseInt(req.params.id);
            
            if (isNaN(courseId)) {
                console.log('ERROR: ID de curso inválido');
                return res.status(400).json({
                    success: false,
                    message: 'ID de curso inválido'
                });
            }
            
            const { title, description, category_id, duration_hours, is_active } = req.body;
            
            // Debug detallado de campos
            console.log('Datos del curso a actualizar:');
            console.log('- ID:', courseId);
            console.log('- Título:', title);
            console.log('- Descripción:', description);
            console.log('- Categoría ID:', category_id);
            console.log('- Duración (horas):', duration_hours);
            console.log('- Activo:', is_active);
            
            // Validación básica
            if (!title || !description || !category_id) {
                console.log('ERROR: Faltan campos obligatorios');
                return res.status(400).json({
                    success: false,
                    message: 'Los campos título, descripción y categoría son obligatorios'
                });
            }
            
            // Verificar que el curso existe
            const existingCourse = await Course.getById(courseId);
            
            if (!existingCourse) {
                console.log(`ERROR: Curso con ID ${courseId} no encontrado`);
                return res.status(404).json({
                    success: false,
                    message: 'Curso no encontrado'
                });
            }
            
            console.log('Curso existente encontrado:', existingCourse.title);
            
            // Actualizar el curso
            const courseData = {
                title,
                description,
                category_id: parseInt(category_id),
                duration_hours: parseInt(duration_hours || 0),
                is_active: is_active === undefined ? true : Boolean(is_active)
            };
            
            console.log('Datos finales para actualizar curso:', courseData);
            
            const updated = await Course.update(courseId, courseData);
            
            if (!updated) {
                console.log('ERROR: No se pudo actualizar el curso');
                return res.status(500).json({
                    success: false,
                    message: 'No se pudo actualizar el curso'
                });
            }
            
            console.log('Curso actualizado exitosamente');
            console.log('=== FIN DE updateCourse ===');
            
            res.status(200).json({
                success: true,
                message: 'Curso actualizado exitosamente',
                data: { id: courseId, ...courseData }
            });
        } catch (error) {
            console.error('ERROR AL ACTUALIZAR CURSO:', error);
            console.error('Stack trace:', error.stack);
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
            console.log('=== INICIO DE deleteCourse ===');
            console.log('Usuario actual:', req.user);
            
            // Validar que el usuario sea administrador
            if (!req.user || !req.user.is_admin) {
                console.log('ERROR: Usuario no es administrador');
                return res.status(403).json({
                    success: false,
                    message: 'No tiene permisos para eliminar cursos'
                });
            }
            
            const courseId = parseInt(req.params.id);
            
            if (isNaN(courseId)) {
                console.log('ERROR: ID de curso inválido');
                return res.status(400).json({
                    success: false,
                    message: 'ID de curso inválido'
                });
            }
            
            console.log(`Intentando eliminar curso con ID: ${courseId}`);
            
            // Verificar que el curso existe
            const existingCourse = await Course.getById(courseId);
            
            if (!existingCourse) {
                console.log(`ERROR: Curso con ID ${courseId} no encontrado`);
                return res.status(404).json({
                    success: false,
                    message: 'Curso no encontrado'
                });
            }
            
            console.log('Curso encontrado:', existingCourse.title);
            
            // Eliminar el curso
            const deleted = await Course.delete(courseId);
            
            if (!deleted) {
                console.log('ERROR: No se pudo eliminar el curso');
                return res.status(500).json({
                    success: false,
                    message: 'No se pudo eliminar el curso'
                });
            }
            
            console.log('Curso eliminado exitosamente');
            console.log('=== FIN DE deleteCourse ===');
            
            res.status(200).json({
                success: true,
                message: 'Curso eliminado exitosamente'
            });
        } catch (error) {
            console.error('ERROR AL ELIMINAR CURSO:', error);
            console.error('Stack trace:', error.stack);
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
            console.log('Obteniendo categorías de cursos');
            
            const categories = await Course.getAllCategories();
            
            console.log(`Se encontraron ${categories.length} categorías`);
            
            res.status(200).json({
                success: true,
                count: categories.length,
                data: categories
            });
        } catch (error) {
            console.error('ERROR AL OBTENER CATEGORÍAS:', error);
            console.error('Stack trace:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las categorías',
                error: error.message
            });
        }
    }
};

module.exports = courseController;