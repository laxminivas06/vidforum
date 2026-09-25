import { institutionRepository } from './institution.repository';

export class InstitutionService {
  async getAllInstitutions() {
    const raw = await institutionRepository.findAll();
    return raw.map((row: any) => ({
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

  async getInstitutionDetails(idOrCode: string) {
    const inst = await institutionRepository.findByIdOrCode(idOrCode);
    if (!inst) {
      throw new Error('Institution not found');
    }
    const modules = await institutionRepository.findModules(inst.id);
    return {
      ...inst,
      modules,
    };
  }

  async getInstitutionStats(idOrCode: string) {
    const inst = await institutionRepository.findByIdOrCode(idOrCode);
    if (!inst) {
      throw new Error('Institution not found');
    }
    return await institutionRepository.getStats(inst.id);
  }

  async toggleModule(idOrCode: string, moduleCode: string, isEnabled: boolean) {
    const inst = await institutionRepository.findByIdOrCode(idOrCode);
    if (!inst) {
      throw new Error('Institution not found');
    }
    return await institutionRepository.upsertModule(inst.id, moduleCode, isEnabled);
  }
}

export const institutionService = new InstitutionService();
