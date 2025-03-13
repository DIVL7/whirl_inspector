/**
 * Middleware básico para autenticación
 */

const authMiddleware = {
    /**
     * Verifica que exista un token en la solicitud
     * Por simplicidad, solo verifica que exista el token
     */
    verifyToken(req, res, next) {
        // Obtener el header de autorización
        const authHeader = req.headers['authorization'];
        
        // Si no hay token, denegar acceso
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Acceso denegado. Se requiere autenticación.'
            });
        }
        
        // Para una implementación simple, solo verificamos que exista el header
        // En una implementación real, se validaría el token con JWT u otra técnica
        
        // Simular la extracción de información del usuario desde el token
        // En una implementación real, esto se obtendría del token decodificado
        req.user = {
            id: 1,  // Valor predeterminado para pruebas
            is_admin: true  // Permitir acceso a rutas de admin para pruebas
        };
        
        next();
    },
    
    /**
     * Verifica que el usuario sea administrador
     */
    isAdmin(req, res, next) {
        if (!req.user || !req.user.is_admin) {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Se requieren privilegios de administrador.'
            });
        }
        
        next();
    }
};

module.exports = authMiddleware;