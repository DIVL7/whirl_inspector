/**
 * Controlador de Autenticación
 * 
 * Maneja el inicio de sesión y verificación de usuarios
 */

const { pool } = require('../config/db');

const authController = {
    /**
     * Inicio de sesión de usuario
     * 
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     */
    async login(req, res) {
        const { employee_number, password } = req.body;
        
        // Validar que se proporcionaron los campos necesarios
        if (!employee_number || !password) {
            return res.status(400).json({
                success: false,
                message: 'Por favor, proporcione el número de empleado y la contraseña'
            });
        }
        
        let conn;
        try {
            conn = await pool.getConnection();
            
            // Consulta para verificar las credenciales
            // En una implementación real, habría que verificar el hash de la contraseña
            const query = `
                SELECT u.id, u.employee_number, u.first_name, u.last_name, 
                       u.email, r.name as role
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.employee_number = ? AND u.password = ?
                AND u.is_active = 1
            `;
            
            const rows = await conn.query(query, [employee_number, password]);
            
            if (rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales incorrectas. Por favor, verifique sus datos.'
                });
            }
            
            // Actualizar el último inicio de sesión
            await conn.query(
                'UPDATE users SET last_login = NOW() WHERE id = ?', 
                [rows[0].id]
            );
            
            // Enviar respuesta con datos del usuario
            return res.json({
                success: true,
                message: 'Inicio de sesión exitoso',
                user: {
                    id: rows[0].id,
                    employee_number: rows[0].employee_number,
                    first_name: rows[0].first_name,
                    last_name: rows[0].last_name,
                    name: `${rows[0].first_name} ${rows[0].last_name}`,
                    email: rows[0].email,
                    role: rows[0].role,
                    is_admin: rows[0].role === 'admin'
                }
            });
        } catch (error) {
            console.error('Error en el inicio de sesión:', error);
            return res.status(500).json({
                success: false,
                message: 'Error del servidor. Por favor, inténtalo de nuevo más tarde.'
            });
        } finally {
            if (conn) conn.release();
        }
    },
    
    /**
     * Verificar el usuario actual
     * 
     * @param {Object} req - Objeto de solicitud Express
     * @param {Object} res - Objeto de respuesta Express
     */
    verify(req, res) {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado'
            });
        }
        
        return res.json({
            success: true,
            message: 'Usuario autenticado',
            user: req.user
        });
    }
};

module.exports = authController;