import express from 'express';
import { getTenantById } from '../controllers/tenantController.js';

const router = express.Router();

router.get('/:id', getTenantById);

export default router;

