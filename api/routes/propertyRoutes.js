// routes/propertyRoutes.js
import express from 'express';
import multer from 'multer';
// import { getProperties, createProperty , getPropertyDetails , latestRentDueProperty , latestNearDateProperty} from '../controllers/propertyController.js';
import { getProperties, getPropertyDetails, assignTenantToProperty,getAssignedProperties, updateRentPaid, unassignTenant, extendTenure, updateOldTenantRent, createProperty, getAssignedPropertiesWithDetails, updateRentDetails, updateYouGave, updateYouGet, updateEndUnit, updateElectricityCharge , updatePropertyAndTenantDetails } from '../controllers/propertyController.js';

const router = express.Router();

  // Property Routes
router.post('/createProperties', createProperty);
router.get('/get', getProperties);
router.get('/get/:id', getPropertyDetails);

// Assigned Tenant Routes
router.put('/:id/assign-tenant', assignTenantToProperty);
router.get('/assigned-properties/details', getAssignedPropertiesWithDetails);
router.patch('/:propertyId/rent', updateRentDetails);
router.get('/assigned', getAssignedProperties);
router.put('/:propertyId/unassign', unassignTenant);
router.put('/:propertyId/extend-tenure', extendTenure);
router.put('/:propertyId/old-tenant/:tenantId/update-rent', updateOldTenantRent);
router.put('/update-yougave/:propertyId/:tenantId', updateYouGave);
router.patch('/update-you-get', updateYouGet);
router.patch('/update-end-unit', updateEndUnit);
router.patch('/update-electricity-charge', updateElectricityCharge );
router.put('/edit/:propertyId/update-details', updatePropertyAndTenantDetails);



// router.post('/properties', createProperty);

// router.get('/latest-rent-due', latestRentDueProperty);
// router.get('/near-end-date', latestNearDateProperty);

export default router;
