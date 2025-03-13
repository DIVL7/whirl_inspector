
/**
 * Configuración de conexión a MariaDB
 * 
 * Este archivo maneja la conexión a la base de datos MariaDB
 */

const mariadb = require('mariadb');

// Crear un pool de conexiones
const pool = mariadb.createPool({
    host: 'localhost',            // Cambiar por la dirección de tu servidor MariaDB
    user: 'root',                 // Cambiar por tu usuario de MariaDB
    password: '',                 // Cambiar por tu contraseña de MariaDB
    database: 'whirl_inspector',  // Nombre de la base de datos
    connectionLimit: 5            // Límite de conexiones simultáneas
});

// Probar la conexión
async function testConnection() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('Conexión a la base de datos establecida correctamente');
        return true;
    } catch (err) {
        console.error('Error de conexión a la base de datos:', err);
        return false;
    } finally {
        if (conn) conn.release(); // Liberar la conexión cuando termine
    }
}

module.exports = {
    pool,
    testConnection
};