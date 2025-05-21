import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLogController';

const router = Router();

router.get('/api/audit-logs', getAuditLogs);

export default router; 