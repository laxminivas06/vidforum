import { Request, Response, NextFunction } from 'express';
import { academicConfigRepository } from './academic-config.repository';
import { sendSuccess, sendError } from '../../utils/api-response';

export class AcademicConfigController {
  // Boards
  async getBoards(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const boards = await academicConfigRepository.listBoards(req.institutionId!);
      sendSuccess(res, boards);
    } catch (err) { next(err); }
  }

  async createBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, name, description, isActive } = req.body;
      if (!code || !name) {
        sendError(res, 'code and name are required', 400);
        return;
      }
      const board = await academicConfigRepository.createBoard(req.institutionId!, {
        code, name, description, isActive
      });
      sendSuccess(res, board, 'Academic board created successfully', 201);
    } catch (err) { next(err); }
  }

  async updateBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const board = await academicConfigRepository.updateBoard(req.institutionId!, String(req.params.id), req.body);
      sendSuccess(res, board, 'Academic board updated successfully');
    } catch (err) { next(err); }
  }

  // Streams
  async getStreams(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const streams = await academicConfigRepository.listStreams(req.institutionId!);
      sendSuccess(res, streams);
    } catch (err) { next(err); }
  }

  async createStream(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, name, description, isActive } = req.body;
      if (!code || !name) {
        sendError(res, 'code and name are required', 400);
        return;
      }
      const stream = await academicConfigRepository.createStream(req.institutionId!, {
        code, name, description, isActive
      });
      sendSuccess(res, stream, 'Academic stream created successfully', 201);
    } catch (err) { next(err); }
  }

  async updateStream(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stream = await academicConfigRepository.updateStream(req.institutionId!, String(req.params.id), req.body);
      sendSuccess(res, stream, 'Academic stream updated successfully');
    } catch (err) { next(err); }
  }

  // Configurations
  async getConfigurations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const configs = await academicConfigRepository.listConfigurations(
        req.institutionId!,
        req.query.academicYearId as string | undefined
      );
      sendSuccess(res, configs);
    } catch (err) { next(err); }
  }

  async createConfiguration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { academicYearId, classId, boardId, streamId, displayOrder, isActive } = req.body;
      if (!academicYearId || !classId || !boardId) {
        sendError(res, 'academicYearId, classId, and boardId are required', 400);
        return;
      }
      const config = await academicConfigRepository.createConfiguration(req.institutionId!, {
        academicYearId, classId, boardId, streamId, displayOrder, isActive
      });
      sendSuccess(res, config, 'Academic configuration saved successfully', 201);
    } catch (err) { next(err); }
  }

  async updateConfiguration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await academicConfigRepository.updateConfiguration(
        req.institutionId!,
        String(req.params.id),
        req.body
      );
      sendSuccess(res, config, 'Academic configuration updated successfully');
    } catch (err) { next(err); }
  }

  async deleteConfiguration(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = await academicConfigRepository.deleteConfiguration(req.institutionId!, String(req.params.id));
      sendSuccess(res, config, 'Academic configuration deactivated successfully');
    } catch (err) { next(err); }
  }

  // Custom Grade Creation
  async createCustomGrade(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, academicYearId, boardId, streamId, displayOrder, optionalSections } = req.body;
      if (!name || !academicYearId || !boardId) {
        sendError(res, 'name, academicYearId, and boardId are required', 400);
        return;
      }
      const result = await academicConfigRepository.createCustomGrade(req.institutionId!, {
        name, academicYearId, boardId, streamId, displayOrder, optionalSections
      });
      sendSuccess(res, result, 'Custom grade and configuration created successfully', 201);
    } catch (err) { next(err); }
  }
}

export const academicConfigController = new AcademicConfigController();
