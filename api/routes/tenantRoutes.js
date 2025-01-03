import express from 'express';
import { getTenantById, createTenant, getTenants, updateTenantDetails} from '../controllers/tenantController.js';
import upload from '../multerConfig.js';

const router = express.Router();


    router.get('/gettenants', getTenants);
    router.get('/:id', getTenantById);
    router.post('/createtenant',upload.fields([
        { name: 'passportPhoto', maxCount: 1 },
        { name: 'signature', maxCount: 1 }
      ]) ,createTenant );
    router.put('/edit/:id', updateTenantDetails);  

  

export default router;

