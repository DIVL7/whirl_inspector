/**
 * Rutas para autenticación de usuarios
 */

const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken, requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// Ruta de inicio de sesión
router.post('/login', authController.login);

// Ruta para verificar sesión actual
router.get('/verify', verifyToken, authController.verify);

// Ruta para cerrar sesión (solo para referencia del cliente)
router.post('/logout', (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Sesión cerrada correctamente'
    });
});

module.exports = router;