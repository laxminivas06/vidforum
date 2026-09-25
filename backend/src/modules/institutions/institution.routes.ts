import { Router } from 'express';
import { institutionController } from './institution.controller';

const router = Router();

// GET /api/v1/institutions
router.get('/', institutionController.getInstitutions.bind(institutionController));

// GET /api/v1/institutions/:id
router.get('/:id', institutionController.getInstitutionById.bind(institutionController));

// GET /api/v1/institutions/:id/stats
router.get('/:id/stats', institutionController.getStats.bind(institutionController));

// PATCH /api/v1/institutions/:id/modules/:moduleCode
router.patch('/:id/modules/:moduleCode', institutionController.toggleModule.bind(institutionController));

export default router;
