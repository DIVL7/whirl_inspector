/**
 * Servidor principal para Whirl Inspector
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool, testConnection } = require('./config/db');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde el directorio raíz del proyecto
app.use(express.static(path.join(__dirname, '..')));

// Ruta principal - sirve el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Ruta para la página de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});

// Rutas para los dashboards
app.get('/user/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'user', 'dashboard.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin', 'dashboard.html'));
});

// Ruta simple para verificar que el servidor está funcionando
app.get('/api', (req, res) => {
    res.json({ message: 'API de Whirl Inspector funcionando correctamente' });
});

// Ruta de prueba para comprobar la conexión a la base de datos
app.get('/api/test-db', async (req, res) => {
    try {
        const isConnected = await testConnection();
        if (isConnected) {
            res.json({ 
                success: true, 
                message: 'Conexión a la base de datos establecida correctamente' 
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Error al conectar con la base de datos' 
            });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error del servidor', 
            error: error.message 
        });
    }
});

// Ruta simple para manejar el inicio de sesión
app.post('/api/login', async (req, res) => {
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
        // Nota: En una aplicación real, las contraseñas deben estar hasheadas
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
                message: 'Número de empleado o contraseña incorrectos'
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
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    // Probar la conexión a la base de datos al iniciar
    testConnection();
});