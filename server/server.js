/**
 * Servidor principal para Whirl Inspector
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool, testConnection } = require('./config/db');

// Importar controladores
const courseController = require('./controllers/courseController');
const { verifyToken, isAdmin } = require('./middleware/authMiddleware');

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

// Rutas para gestión de cursos
app.get('/admin/courses', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin', 'courses', 'index.html'));
});

app.get('/admin/courses/create', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin', 'courses', 'create.html'));
});

app.get('/admin/courses/edit/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin', 'courses', 'edit.html'));
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

// Ruta para manejar el inicio de sesión
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
        
        // Para depuración, imprimir los valores recibidos
        console.log('Intentando autenticar:', { employee_number });
        
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
        console.log('Resultados encontrados:', rows.length);
        
        if (rows.length === 0) {
            // Para depuración
            console.log('Credenciales incorrectas');
            
            // Intentar verificar si el usuario existe pero la contraseña es incorrecta
            const userQuery = `SELECT id FROM users WHERE employee_number = ?`;
            const userExists = await conn.query(userQuery, [employee_number]);
            
            if (userExists.length > 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Contraseña incorrecta'
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no encontrado'
                });
            }
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
        console.error('Error detallado en el inicio de sesión:', error);
        
        // Para propósitos de desarrollo, permitamos bypass para pruebas
        if (employee_number === 'admin123' && password === 'admin123') {
            return res.json({
                success: true,
                message: 'Inicio de sesión exitoso (modo admin de prueba)',
                user: {
                    id: 999,
                    employee_number: 'admin123',
                    first_name: 'Admin',
                    last_name: 'Test',
                    name: 'Admin Test',
                    role: 'admin',
                    is_admin: true
                }
            });
        }
        
        if (employee_number === 'user123' && password === 'user123') {
            return res.json({
                success: true,
                message: 'Inicio de sesión exitoso (modo usuario de prueba)',
                user: {
                    id: 998,
                    employee_number: 'user123',
                    first_name: 'Usuario',
                    last_name: 'Test',
                    name: 'Usuario Test',
                    role: 'user',
                    is_admin: false
                }
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Error en el servidor. Por favor, inténtalo de nuevo más tarde.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        if (conn) conn.release();
    }
});

// API Routes para cursos
app.get('/api/courses/categories', courseController.getAllCategories);
app.get('/api/courses', courseController.getAllCourses);
app.get('/api/courses/:id', courseController.getCourseById);
app.post('/api/courses', courseController.createCourse);
app.put('/api/courses/:id', courseController.updateCourse);
app.delete('/api/courses/:id', courseController.deleteCourse);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    // Probar la conexión a la base de datos al iniciar
    testConnection();
});