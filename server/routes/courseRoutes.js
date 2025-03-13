/**
 * Rutas para gestión de cursos
 */

const express = require('express');
const courseController = require('../controllers/courseController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Aplicar middleware de verificación de token a todas las rutas
router.use(verifyToken);

// Rutas públicas (accesibles para usuarios autenticados)
router.get('/categories', courseController.getAllCategories);
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Rutas protegidas (solo para administradores)
router.post('/', isAdmin, courseController.createCourse);
router.put('/:id', isAdmin, courseController.updateCourse);
router.delete('/:id', isAdmin, courseController.deleteCourse);

module.exports = router;