import { institutionRepository } from './institution.repository';
import { env } from '../../config/env';

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

      // Return database institutions as primary source of truth
      const seen = new Set<string>();
      return [...dbList, ...this.inMemoryInstitutions].filter((item) => {
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

  async getModules(idOrCode: string) {
    const inst = await institutionRepository.findByIdOrCode(idOrCode);
    if (!inst) {
      throw new Error('Institution not found');
    }
    return await institutionRepository.findModules(inst.id);
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
      status: (row?.status || 'ACTIVE').toUpperCase(),
      plan: data.plan || 'ENTERPRISE',
      studentsCount: 0,
      facultyCount: 0,
      createdAt: row?.created_at ? new Date(row.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      region: data.region || 'India',
      boardAffiliation: data.boardAffiliation || 'State Board',
      contactEmail: data.contactEmail || '',
    };

    if (!row) {
      this.inMemoryInstitutions.unshift(newInst);
    }
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

    let inst: any = null;
    try {
      inst = await institutionRepository.findByIdOrCode(institutionId);
    } catch (e) {
      // ignore
    }
    if (!inst) {
      inst = this.inMemoryInstitutions.find((i) => i.id === institutionId || i.code === institutionId);
    }

    const targetInstId = inst?.id || institutionId;
    const targetInstName = inst?.name || 'Partner Institution';
    const targetInstCode = inst?.code || 'INST';

    // Directly persist to Cloud PostgreSQL
    try {
      await institutionRepository.createAdmin({
        userId: data.userId.trim().toLowerCase(),
        name: data.name?.trim() || data.userId.trim(),
        email: data.email.trim().toLowerCase(),
        institutionId: targetInstId,
        workspaces: Array.isArray(data.workspaces) ? data.workspaces : [],
        password: data.password || env.DEFAULT_INITIAL_PASSWORD,
      });
    } catch (dbErr) {
      console.warn('Database admin persistence error:', (dbErr as any)?.message);
    }

    const admin: StoredInstituteAdmin = {
      id: `adm-${Date.now()}`,
      userId: data.userId.trim().toLowerCase(),
      name: data.name?.trim() || data.userId.trim(),
      email: data.email.trim().toLowerCase(),
      password: '••••••••',
      institutionId: targetInstId,
      institutionName: targetInstName,
      institutionCode: targetInstCode,
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

  async getInstitutionAdmins(institutionId: string): Promise<StoredInstituteAdmin[]> {
    try {
      const dbAdmins = await institutionRepository.findAdmins(institutionId);
      if (dbAdmins && dbAdmins.length > 0) {
        return dbAdmins.map((row: any) => ({
          id: row.id,
          userId: row.userId || row.email,
          name: row.name,
          email: row.email,
          password: '••••••••',
          institutionId: row.institutionId,
          institutionName: row.institutionName,
          institutionCode: row.institutionCode,
          workspaces: Array.isArray(row.workspaces) ? row.workspaces : [],
          createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
        }));
      }
    } catch (e) {
      console.warn('Database query for institution admins unavailable:', (e as any)?.message);
    }

    return this.instituteAdmins.filter(
      (a) => a.institutionId === institutionId || a.institutionCode === institutionId
    );
  }

  async updateAdminWorkspaces(institutionId: string, adminIdOrEmail: string, workspaces: string[]) {
    const cleanWorkspaces = Array.isArray(workspaces) ? workspaces : [];

    // Directly update Cloud PostgreSQL DB
    let dbUpdated = null;
    try {
      dbUpdated = await institutionRepository.updateAdminWorkspaces(institutionId, adminIdOrEmail, cleanWorkspaces);
    } catch (err) {
      console.warn('Database updateAdminWorkspaces error:', (err as any)?.message);
    }

    // Also update in-memory state if found
    const cleanIdentifier = adminIdOrEmail.trim().toLowerCase();
    const adminIndex = this.instituteAdmins.findIndex(
      (a) =>
        a.id.toLowerCase() === cleanIdentifier ||
        a.userId.toLowerCase() === cleanIdentifier ||
        a.email.toLowerCase() === cleanIdentifier
    );

    if (adminIndex !== -1) {
      this.instituteAdmins[adminIndex].workspaces = cleanWorkspaces;
    }

    return {
      success: true,
      adminId: adminIdOrEmail,
      workspaces: cleanWorkspaces,
      dbUpdated: !!dbUpdated,
    };
  }

  findAdminByIdentifier(identifier: string): StoredInstituteAdmin | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.instituteAdmins.find(
      (a) => a.userId.toLowerCase() === clean || a.email.toLowerCase() === clean
    );
  }

  async updateInstitutionStatus(idOrCode: string, status: string) {
    const normalized = (status || 'active').toLowerCase() as 'active' | 'inactive' | 'suspended';
    if (!['active', 'inactive', 'suspended'].includes(normalized)) {
      throw new Error(`Invalid status: ${status}. Must be active, inactive, or suspended.`);
    }

    let updatedRow: any = null;
    try {
      updatedRow = await institutionRepository.updateStatus(idOrCode, normalized);
    } catch (err) {
      console.warn('Database institution status update failed:', (err as any)?.message);
    }

    // Also update any matching in-memory entry
    const memoryInst = this.inMemoryInstitutions.find(
      (i) => i.id === idOrCode || i.code?.toLowerCase() === idOrCode.toLowerCase()
    );
    if (memoryInst) {
      memoryInst.status = normalized.toUpperCase();
    }

    if (updatedRow) {
      return {
        id: updatedRow.id,
        code: updatedRow.code,
        name: updatedRow.name,
        status: updatedRow.status.toUpperCase(),
        domain: updatedRow.settings?.domain || `${updatedRow.code.toLowerCase().replace('-', '')}.vid.edu`,
        updatedAt: updatedRow.updated_at,
      };
    }

    if (memoryInst) {
      return memoryInst;
    }

    throw new Error('Institution not found');
  }
}

export const institutionService = new InstitutionService();

