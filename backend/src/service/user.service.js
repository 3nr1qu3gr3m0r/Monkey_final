const db = require('../config/db');

// Función dinámica: busca por correo o por teléfono dependiendo de 'esCorreo'
const buscarUsuarioPorContacto = async (contacto, esCorreo) => {
    // Definimos qué columna buscar de forma segura
    const columna = esCorreo ? 'correo' : 'telefono';
    
    // Inyectamos la columna y pasamos el valor de forma segura contra SQL Injection
    const [rows] = await db.query(`SELECT * FROM usuarios WHERE ${columna} = ?`, [contacto]);
    
    return rows.length > 0 ? rows[0] : null; 
};

// Insertamos respetando tu nuevo esquema (contrasena_hash, correo, telefono)
const crearUsuario = async (nombre, correo, telefono, contrasenaHash, rol) => {
    const [result] = await db.query(
        'INSERT INTO usuarios (nombre, correo, telefono, contrasena_hash, rol) VALUES (?, ?, ?, ?, ?)',
        [nombre, correo, telefono, contrasenaHash, rol]
    );
    return result.insertId; 
};

// Buscar usuario por ID (para el perfil)
const buscarUsuarioPorId = async (id) => {
    const [rows] = await db.query('SELECT id, nombre, correo, telefono, rol FROM usuarios WHERE id = ?', [id]);
    return rows.length > 0 ? rows[0] : null;
};

// Actualizar datos del usuario
const actualizarUsuario = async (id, nombre, correo, telefono) => {
    const [result] = await db.query(
        'UPDATE usuarios SET nombre = ?, correo = ?, telefono = ? WHERE id = ?',
        [nombre, correo, telefono, id]
    );
    return result.affectedRows > 0;
};

// Eliminar usuario
const eliminarUsuario = async (id) => {
    const [result] = await db.query('DELETE FROM usuarios WHERE id = ?', [id]);
    return result.affectedRows > 0;
};

module.exports = {
    buscarUsuarioPorContacto,
    crearUsuario,
    buscarUsuarioPorId, 
    actualizarUsuario,
    eliminarUsuario
};