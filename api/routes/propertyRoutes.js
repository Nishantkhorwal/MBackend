// routes/propertyRoutes.js
import express from 'express';
// import { getProperties, createProperty , getPropertyDetails , latestRentDueProperty , latestNearDateProperty} from '../controllers/propertyController.js';
import { getProperties, getPropertyDetails, assignTenant, getAssignedProperties, updateRentPaid, unassignTenant, extendTenure, updateOldTenantRent  } from '../controllers/propertyController.js';

const router = express.Router();

router.get('/get', getProperties);
router.get('/get/:id', getPropertyDetails);
router.post('/:propertyId/assign', assignTenant);
router.get('/assigned', getAssignedProperties);
router.put('/:propertyId/update-rent', updateRentPaid);
router.put('/:propertyId/unassign', unassignTenant);
router.put('/:propertyId/extend-tenure',extendTenure);
router.put('/:propertyId/old-tenant/:tenantId/update-rent', updateOldTenantRent);


// router.post('/properties', createProperty);

// router.get('/latest-rent-due', latestRentDueProperty);
// router.get('/near-end-date', latestNearDateProperty);

export default router;
