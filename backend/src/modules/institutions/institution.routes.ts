import { Router } from 'express';
import { institutionController } from './institution.controller';

const router = Router();

// GET /api/v1/institutions
router.get('/', institutionController.getInstitutions.bind(institutionController));

// POST /api/v1/institutions
router.post('/', institutionController.createInstitution.bind(institutionController));

// GET /api/v1/institutions/:id
router.get('/:id', institutionController.getInstitutionById.bind(institutionController));

// GET /api/v1/institutions/:id/stats
router.get('/:id/stats', institutionController.getStats.bind(institutionController));

// PATCH /api/v1/institutions/:id/modules/:moduleCode
router.patch('/:id/modules/:moduleCode', institutionController.toggleModule.bind(institutionController));

// GET /api/v1/institutions/:id/admins
router.get('/:id/admins', institutionController.getAdmins.bind(institutionController));

// POST /api/v1/institutions/:id/admins
router.post('/:id/admins', institutionController.addAdmin.bind(institutionController));

// PATCH /api/v1/institutions/:id/status
router.patch('/:id/status', institutionController.updateStatus.bind(institutionController));

export default router;

