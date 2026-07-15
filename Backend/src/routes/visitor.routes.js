import { Router } from 'express';
import { registrarVisitante, obtenerEstadisticas, generarReportePDF } from '../controllers/visitor.controller.js';
import { validate, visitorSchema } from '../middlewares/validate.middleware.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Ruta pública para registrar visitas
router.post('/', validate(visitorSchema), registrarVisitante);

// Rutas protegidas para el dashboard y reportes
router.get('/stats', authenticateToken, obtenerEstadisticas);
router.get('/report', authenticateToken, generarReportePDF);

export default router;
