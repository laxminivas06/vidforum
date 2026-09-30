import { institutionRepository } from './institution.repository';

export interface StoredInstituteAdmin {
  id: string;
  userId: string;
  name: string;
  email: string;
  password: string;
  institutionId: string;
  institutionName: string;
  institutionCode: string;
  workspaces: string[];
  createdAt: string;
}

export class InstitutionService {
  private inMemoryInstitutions: any[] = [];
  private instituteAdmins: StoredInstituteAdmin[] = [];

  async getAllInstitutions() {
    try {
      const raw = await institutionRepository.findAll();
      const dbList = raw.map((row: any) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        domain: row.settings?.domain || `${row.code.toLowerCase().replace('-', '')}.vid.edu`,
        status: row.status.toUpperCase(),
        plan: row.plan,
        studentsCount: parseInt(row.studentsCount, 10),
        facultyCount: parseInt(row.facultyCount, 10),
        createdAt: row.createdAt
          ? new Date(row.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        region: row.address || 'India',
        boardAffiliation: row.settings?.boardAffiliation,
        contactEmail: row.contactEmail,
      }));

      // Merge with in-memory provisioned institutions without duplicates
      const seen = new Set<string>();
      return [...this.inMemoryInstitutions, ...dbList].filter((item) => {
        const key = (item.code || item.id || '').toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    } catch (err) {
      console.warn('Database query for institutions unavailable, using memory store:', (err as any)?.message);
      return this.inMemoryInstitutions;
    }
  }

  async getInstitutionDetails(idOrCode: string) {
    try {
      const inst = await institutionRepository.findByIdOrCode(idOrCode);
      if (inst) {
        const modules = await institutionRepository.findModules(inst.id);
        return { ...inst, modules };
      }
    } catch (err) {
      console.warn('Database query for institution details unavailable:', (err as any)?.message);
    }

    const memoryInst = this.inMemoryInstitutions.find(
      (i) => i.id === idOrCode || i.code?.toLowerCase() === idOrCode.toLowerCase()
    );
    if (memoryInst) {
      return memoryInst;
    }
    throw new Error('Institution not found');
  }

  async getInstitutionStats(idOrCode: string) {
    try {
      const inst = await institutionRepository.findByIdOrCode(idOrCode);
      if (inst) {
        return await institutionRepository.getStats(inst.id);
      }
    } catch (err) {
      console.warn('Database query for institution stats unavailable:', (err as any)?.message);
    }
    return {
      studentsCount: 0,
      facultyCount: 0,
      activeModulesCount: 6,
      monthlyActiveUsers: 0,
    };
  }

  async toggleModule(idOrCode: string, moduleCode: string, isEnabled: boolean) {
    try {
      const inst = await institutionRepository.findByIdOrCode(idOrCode);
      if (inst) {
        return await institutionRepository.upsertModule(inst.id, moduleCode, isEnabled);
      }
    } catch (err) {
      console.warn('Database module toggle unavailable:', (err as any)?.message);
    }
    return { moduleCode, isEnabled };
  }

  async createInstitution(data: any) {
    let row: any = null;
    try {
      row = await institutionRepository.create(data);
    } catch (err) {
      console.warn('Database institution creation unavailable, saving in-memory:', (err as any)?.message);
    }

    const newInst = {
      id: row?.id || `inst-${Date.now()}`,
      name: row?.name || data.name,
      code: row?.code || data.code,
      domain: data.domain || `${data.code.toLowerCase().replace('-', '')}.vid.edu`,
      status: 'ACTIVE',
      plan: data.plan || 'ENTERPRISE',
      studentsCount: 0,
      facultyCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      region: data.region || 'India',
      boardAffiliation: data.boardAffiliation || 'State Board',
      contactEmail: data.contactEmail || '',
    };

    this.inMemoryInstitutions.unshift(newInst);
    return newInst;
  }

  async addInstitutionAdmin(institutionId: string, data: {
    userId: string;
    email: string;
    password?: string;
    workspaces: string[];
    name?: string;
  }) {
    if (!data.userId || !data.email) {
      throw new Error('User ID and email are required');
    }

    const inst = this.inMemoryInstitutions.find((i) => i.id === institutionId || i.code === institutionId);

    const admin: StoredInstituteAdmin = {
      id: `adm-${Date.now()}`,
      userId: data.userId.trim().toLowerCase(),
      name: data.name?.trim() || data.userId.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password || 'admin123',
      institutionId: inst?.id || institutionId,
      institutionName: inst?.name || 'Partner Institution',
      institutionCode: inst?.code || 'INST',
      workspaces: Array.isArray(data.workspaces) ? data.workspaces : [],
      createdAt: new Date().toISOString(),
    };

    // Remove existing with same email or userId if any
    this.instituteAdmins = this.instituteAdmins.filter(
      (a) => a.email !== admin.email && a.userId !== admin.userId
    );
    this.instituteAdmins.push(admin);

    return {
      id: admin.id,
      userId: admin.userId,
      name: admin.name,
      email: admin.email,
      institutionId: admin.institutionId,
      institutionName: admin.institutionName,
      institutionCode: admin.institutionCode,
      workspaces: admin.workspaces,
      createdAt: admin.createdAt,
    };
  }

  getInstitutionAdmins(institutionId: string): StoredInstituteAdmin[] {
    return this.instituteAdmins.filter(
      (a) => a.institutionId === institutionId || a.institutionCode === institutionId
    );
  }

  findAdminByIdentifier(identifier: string): StoredInstituteAdmin | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.instituteAdmins.find(
      (a) => a.userId.toLowerCase() === clean || a.email.toLowerCase() === clean
    );
  }
}

export const institutionService = new InstitutionService();
