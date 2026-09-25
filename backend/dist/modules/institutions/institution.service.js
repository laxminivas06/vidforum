"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.institutionService = exports.InstitutionService = void 0;
const institution_repository_1 = require("./institution.repository");
class InstitutionService {
    async getAllInstitutions() {
        const raw = await institution_repository_1.institutionRepository.findAll();
        return raw.map((row) => ({
            id: row.id,
            name: row.name,
            code: row.code,
            domain: row.settings?.domain || `${row.code.toLowerCase().replace('-', '')}.vid.edu`,
            status: row.status.toUpperCase(),
            plan: row.plan,
            studentsCount: parseInt(row.studentsCount, 10),
            facultyCount: parseInt(row.facultyCount, 10),
            createdAt: row.createdAt?.toISOString ? row.createdAt.toISOString().split('T')[0] : '2026-09-25',
            region: row.address || 'India',
        }));
    }
    async getInstitutionDetails(idOrCode) {
        const inst = await institution_repository_1.institutionRepository.findByIdOrCode(idOrCode);
        if (!inst) {
            throw new Error('Institution not found');
        }
        const modules = await institution_repository_1.institutionRepository.findModules(inst.id);
        return {
            ...inst,
            modules,
        };
    }
    async getInstitutionStats(idOrCode) {
        const inst = await institution_repository_1.institutionRepository.findByIdOrCode(idOrCode);
        if (!inst) {
            throw new Error('Institution not found');
        }
        return await institution_repository_1.institutionRepository.getStats(inst.id);
    }
    async toggleModule(idOrCode, moduleCode, isEnabled) {
        const inst = await institution_repository_1.institutionRepository.findByIdOrCode(idOrCode);
        if (!inst) {
            throw new Error('Institution not found');
        }
        return await institution_repository_1.institutionRepository.upsertModule(inst.id, moduleCode, isEnabled);
    }
}
exports.InstitutionService = InstitutionService;
exports.institutionService = new InstitutionService();
