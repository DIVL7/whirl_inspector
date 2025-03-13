/**
 * Rutas para autenticación de usuarios
 */

const express = require('express');
const router = express.Router();

// Ruta simple para login (ya implementada en server.js, esto es para organización)
router.post('/login', async (req, res) => {
    // Esta ruta está implementada directamente en server.js
    // Este archivo es para organización futura
});

// Ruta para verificar sesión actual
router.get('/verify', (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Token válido'
    });
});

module.exports = router;