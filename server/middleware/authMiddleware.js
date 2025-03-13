/**
 * Middleware de autenticación
 */

const { pool } = require('../config/db');

const authMiddleware = {
    /**
     * Verifica que exista un token en la solicitud
     * Para desarrollo, permitimos acceso abierto
     */
    async verifyToken(req, res, next) {
        console.log('=== VERIFICANDO TOKEN ===');
        
        // Obtener el header de autorización
        const authHeader = req.headers['authorization'];
        console.log('Header de autorización:', authHeader);
        
        // Para development, creamos un usuario administrador por defecto
        // SOLO PARA DEPURACIÓN - REEMPLAZAR CON AUTENTICACIÓN REAL
        req.user = {
            id: 1,  // ID del usuario administrador en la base de datos
            employee_number: 'A12345',
            name: 'Admin de Prueba',
            is_admin: true  
        };
        
        console.log('Usuario asignado:', req.user);
        console.log('=== FIN VERIFICACIÓN TOKEN ===');
        
        next();
    },
    
    /**
     * Asegura que el usuario esté autenticado para acceder
     */
    requireAuth(req, res, next) {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Acceso denegado. Debe iniciar sesión.'
            });
        }
        next();
    },
    
    /**
     * Verifica que el usuario sea administrador
     */
    isAdmin(req, res, next) {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Acceso denegado. Debe iniciar sesión.'
            });
        }
        
        if (!req.user.is_admin) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Se requieren privilegios de administrador.'
            });
        }
        
        next();
    }
};

module.exports = authMiddleware;