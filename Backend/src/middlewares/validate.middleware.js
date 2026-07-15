import { z } from 'zod';

// Schema para registrar un visitante
export const visitorSchema = z.object({
  folio_boleto: z.string().min(1, "El folio de boleto es requerido"),
  nombre_visitante: z.string().min(1, "El nombre de visitante es requerido"),
  num_personas: z.number().int().positive("El número de personas debe ser mayor a 0"),
  hombres: z.number().int().nonnegative("El número de hombres no puede ser negativo"),
  mujeres: z.number().int().nonnegative("El número de mujeres no puede ser negativo"),
  ninos: z.number().int().nonnegative("El número de niños no puede ser negativo"),
  jovenes: z.number().int().nonnegative("El número de jóvenes no puede ser negativo"),
  adultos: z.number().int().nonnegative("El número de adultos no puede ser negativo"),
  tercera_edad: z.number().int().nonnegative("El número de tercera edad no puede ser negativo"),
  tipo_procedencia: z.enum(["Local", "Nacional", "Internacional"], {
    errorMap: () => ({ message: "Tipo de procedencia inválido" })
  }),
  procedencia: z.string().min(1, "La procedencia es requerida"),
  municipio: z.string().nullable().optional()
}).refine((data) => data.hombres + data.mujeres === data.num_personas, {
  message: "La suma de hombres y mujeres debe ser igual al número total de personas",
  path: ["num_personas"]
}).refine((data) => data.ninos + data.jovenes + data.adultos + data.tercera_edad === data.num_personas, {
  message: "La suma de niños, jóvenes, adultos y tercera edad debe ser igual al número total de personas",
  path: ["num_personas"]
});

// Schema para login
export const loginSchema = z.object({
  correo: z.string().min(1, "El correo o usuario es requerido"),
  contrasena: z.string().min(1, "La contraseña es requerida")
});

// Schema para registrar usuario
export const registerSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  correo: z.string().min(1, "El correo o usuario es requerido"),
  contrasena: z.string().min(8, "La contraseña debe tener al menos 8 caracteres")
});

// Middleware genérico de validación
export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Error de validación",
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};
