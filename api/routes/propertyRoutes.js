// routes/propertyRoutes.js
import express from 'express';
import { getProperties, createProperty , getPropertyDetails , latestRentDueProperty , latestNearDateProperty} from '../controllers/propertyController.js';

const router = express.Router();

router.get('/properties', getProperties);
router.post('/properties', createProperty);
router.get('/properties/:id', getPropertyDetails);
router.get('/latest-rent-due', latestRentDueProperty);
router.get('/near-end-date', latestNearDateProperty);

export default router;
