import Tenant from '../models/tenantModel.js';



export const createTenant = async (req, res) => {
  const {
    fullName,
    fatherName,
    spouseName,
    occupation,
    nationality,
    age,
    sex,
    caste,
    houseNo,
    sectorVillageLocality,
    policeStation,
    districtAndState,
    landlineOrMobile,
    natureOfEmployment,
    
    // Assigned property will be added later
  } = req.body;

  try {
    // Create a new tenant without assigning a property
    const newTenant = new Tenant({
      fullName,
      fatherName,
      spouseName,
      occupation,
      nationality,
      age,
      sex,
      caste,
      houseNo,
      sectorVillageLocality,
      policeStation,
      districtAndState,
      landlineOrMobile,
      natureOfEmployment,
      passportPhoto: req.files['passportPhoto'] ? req.files['passportPhoto'][0].path : null,
      signature: req.files['signature'] ? req.files['signature'][0].path : null
     
    });

    // Save the tenant to the database
    const savedTenant = await newTenant.save();

    res.status(201).json(savedTenant);
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ message: 'Error creating tenant', error });
  }
};




export const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find()
      .populate({
        path: 'assignedProperty', // Populate the assigned property
        select: 'propertyName assignedTenant', // Select fields from the property
        populate: {
          path: 'assignedTenant', // Populate the tenant assignment details
          select: 'rentHistory' // Select only rentHistory from the tenant assignment schema
        }
      });

    res.status(200).json(tenants);
  } catch (error) {
    console.error('Error fetching tenants:', error);
    res.status(500).json({ message: error.message });
  }
};


// Update tenant details
export const updateTenantDetails = async (req, res) => {
  const tenantId = req.params.id;
  const updatedData = req.body;  // Only contains fields that need to be updated

  try {
    // Update only fields provided in `updatedData`
    const updatedTenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { $set: updatedData },
      { new: true, runValidators: true } // `new: true` returns the updated document, `runValidators` ensures validation
    );

    if (!updatedTenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    res.status(200).json(updatedTenant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update tenant details', error });
  }
};





// Get tenant by ID
export const getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).populate('assignedProperty');
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


// Assign tenant to a property


  