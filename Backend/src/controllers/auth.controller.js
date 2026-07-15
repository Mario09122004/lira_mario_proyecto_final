import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import dotenv from 'dotenv';

dotenv.config();

export const login = async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    const result = await pool.query('SELECT * FROM "Usuarios".cuentas WHERE correo = $1', [correo]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas (correo o contraseña)."
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(contrasena, user.contrasena);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas (correo o contraseña)."
      });
    }

    // Firmar Token JWT
    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, correo: user.correo },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso.",
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo
      }
    });

  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor al iniciar sesión."
    });
  }
};

export const register = async (req, res) => {
  const { nombre, correo, contrasena } = req.body;

  try {
    // Verificar si el correo ya está registrado
    const userCheck = await pool.query('SELECT * FROM "Usuarios".cuentas WHERE correo = $1', [correo]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "El correo electrónico ya está registrado."
      });
    }

    // Cifrar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    // Insertar nuevo usuario
    const result = await pool.query(
      'INSERT INTO "Usuarios".cuentas (nombre, correo, contrasena) VALUES ($1, $2, $3) RETURNING id, nombre, correo, fecha_creacion',
      [nombre, correo, hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente por un administrador.",
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Error en registro:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor al registrar el usuario."
    });
  }
};
