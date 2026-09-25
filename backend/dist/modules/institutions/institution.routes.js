"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const institution_controller_1 = require("./institution.controller");
const router = (0, express_1.Router)();
// GET /api/v1/institutions
router.get('/', institution_controller_1.institutionController.getInstitutions.bind(institution_controller_1.institutionController));
// GET /api/v1/institutions/:id
router.get('/:id', institution_controller_1.institutionController.getInstitutionById.bind(institution_controller_1.institutionController));
// GET /api/v1/institutions/:id/stats
router.get('/:id/stats', institution_controller_1.institutionController.getStats.bind(institution_controller_1.institutionController));
// PATCH /api/v1/institutions/:id/modules/:moduleCode
router.patch('/:id/modules/:moduleCode', institution_controller_1.institutionController.toggleModule.bind(institution_controller_1.institutionController));
exports.default = router;
