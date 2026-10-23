import { Request, Response, NextFunction } from 'express';
import { academicFeeRepository } from './academic-fees.repository';
import { sendSuccess, sendError } from '../../utils/api-response';

export class AcademicFeeController {
  async listStructures(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await academicFeeRepository.listStructures(req.institutionId!, {
        academicYearId: req.query.academicYearId as string | undefined,
        classId: req.query.classId as string | undefined,
        boardId: req.query.boardId as string | undefined,
        streamId: req.query.streamId as string | undefined,
        status: req.query.status as string | undefined,
      });
      sendSuccess(res, list);
    } catch (err) { next(err); }
  }

  async getStructureById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const struct = await academicFeeRepository.getStructureById(req.institutionId!, String(req.params.id));
      if (!struct) {
        sendError(res, 'Academic fee structure not found', 404);
        return;
      }
      sendSuccess(res, struct);
    } catch (err) { next(err); }
  }

  async saveStructure(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { academicYearId, academicConfigurationId, tuitionFee, components, status } = req.body;
      if (!academicYearId || !academicConfigurationId) {
        sendError(res, 'academicYearId and academicConfigurationId are required', 400);
        return;
      }
      const saved = await academicFeeRepository.upsertStructure(req.institutionId!, {
        academicYearId,
        academicConfigurationId,
        tuitionFee: Number(tuitionFee || 0),
        components: components || [],
        status: status || 'active',
      });
      sendSuccess(res, saved, 'Academic fee structure saved with dynamic heads', 201);
    } catch (err) { next(err); }
  }
}

export const academicFeeController = new AcademicFeeController();
