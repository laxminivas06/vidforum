import { Router, Request, Response } from 'express';
import { db } from '../../config/database';
import { sendSuccess, sendError } from '../../utils/api-response';
import { tenantMiddleware } from '../../middleware/tenant.middleware';

const router = Router();

// GET /api/v1/optional-modules/events
router.get('/events', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const result = await db.query('SELECT * FROM events WHERE institution_id = $1 ORDER BY start_time DESC', [instId]);
    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// GET /api/v1/optional-modules/transport/routes
router.get('/transport/routes', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const result = await db.query('SELECT * FROM transport_routes WHERE institution_id = $1 ORDER BY name ASC', [instId]);
    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// GET /api/v1/optional-modules/hostels
router.get('/hostels', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const result = await db.query('SELECT * FROM hostels WHERE institution_id = $1 ORDER BY name ASC', [instId]);
    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// GET /api/v1/optional-modules/library/books
router.get('/library/books', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const result = await db.query('SELECT * FROM library_books WHERE institution_id = $1 ORDER BY title ASC', [instId]);
    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// GET /api/v1/optional-modules/sports/teams
router.get('/sports/teams', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const result = await db.query('SELECT * FROM sports_teams WHERE institution_id = $1 ORDER BY name ASC', [instId]);
    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

// GET /api/v1/optional-modules/inventory/assets
router.get('/inventory/assets', tenantMiddleware, async (req: Request, res: Response) => {
  try {
    const instId = req.institutionId!;
    const result = await db.query('SELECT * FROM inventory_assets WHERE institution_id = $1 ORDER BY name ASC', [instId]);
    sendSuccess(res, result.rows);
  } catch (error: any) {
    sendError(res, error.message, 500);
  }
});

export default router;
