import { Router, Request, Response } from 'express';
import { faceAttendanceService } from './face.service';
import { sendSuccess, sendError } from '../../utils/api-response';

const caller = (req: Request) => ({ id: req.user!.id, role: req.user!.role });

function fail(res: Response, err: any) {
  const msg: string = err.message || 'Face attendance request failed';
  const status = msg.startsWith('UNAUTHORIZED') ? 401 : msg.includes('RESOURCE_ACCESS_DENIED') ? 403 : 400;
  sendError(res, msg, status);
}

// Mounted inside attendance.routes.ts (JWT + tenant already enforced)
export const faceRouter = Router();

faceRouter.get('/sections', async (req, res) => {
  try {
    sendSuccess(res, await faceAttendanceService.listSections(req.institutionId!, caller(req)));
  } catch (err) { fail(res, err); }
});

faceRouter.get('/gallery/:sectionId', async (req, res) => {
  try {
    sendSuccess(res, await faceAttendanceService.getGallery(req.institutionId!, String(req.params.sectionId), caller(req)));
  } catch (err) { fail(res, err); }
});

faceRouter.post('/enroll', async (req, res) => {
  try {
    sendSuccess(res, await faceAttendanceService.enroll(req.institutionId!, req.body, caller(req)), 'Face enrollment saved', 201);
  } catch (err) { fail(res, err); }
});

faceRouter.delete('/enroll/:studentId', async (req, res) => {
  try {
    sendSuccess(res, await faceAttendanceService.deleteEnrollment(req.institutionId!, String(req.params.studentId), caller(req)));
  } catch (err) { fail(res, err); }
});

faceRouter.post('/devices', async (req, res) => {
  try {
    sendSuccess(res, await faceAttendanceService.registerDevice(req.institutionId!, req.body, caller(req)), 'Device registered', 201);
  } catch (err) { fail(res, err); }
});

faceRouter.get('/events', async (req, res) => {
  try {
    const { sectionId, from, to } = req.query;
    sendSuccess(
      res,
      await faceAttendanceService.listSectionEvents(req.institutionId!, String(sectionId), String(from), String(to), caller(req))
    );
  } catch (err) { fail(res, err); }
});

faceRouter.post('/submit', async (req, res) => {
  try {
    sendSuccess(res, await faceAttendanceService.submit(req.institutionId!, req.body, caller(req)), 'Face attendance submitted');
  } catch (err) { fail(res, err); }
});

// Public (device-key authenticated) push endpoint for dedicated biometric terminals.
// Mounted in api.v1.ts BEFORE the JWT-protected /attendance router.
export const faceDeviceRouter = Router();

faceDeviceRouter.post('/', async (req: Request, res: Response) => {
  try {
    const key = req.headers['x-device-key'];
    sendSuccess(res, await faceAttendanceService.ingestDeviceEvents(typeof key === 'string' ? key : undefined, req.body));
  } catch (err) { fail(res, err); }
});
