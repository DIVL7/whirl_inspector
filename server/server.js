/**
 * Servidor principal para Whirl Inspector
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { pool, testConnection } = require('./config/db');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const authController = require('./controllers/authController');

// Inicializar Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde el directorio raíz del proyecto
app.use(express.static(path.join(__dirname, '..')));

// Rutas de vistas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});

app.get('/user/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'user', 'dashboard.html'));
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin', 'dashboard.html'));
});

// Rutas para gestión de cursos (vistas)
app.get('/admin/courses', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin', 'courses', 'index.html'));
});

app.get('/admin/courses/create', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin', 'courses', 'create.html'));
});

app.get('/admin/courses/edit/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin', 'courses', 'edit.html'));
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);

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

// Mantener la ruta de login compatible con implementaciones anteriores
app.post('/api/login', authController.login);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    // Probar la conexión a la base de datos al iniciar
    testConnection();
});