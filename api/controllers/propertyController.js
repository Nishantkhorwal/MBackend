import PropertyRof from '../models/propertyModel.js';
import Tenant from '../models/tenantModel.js'; // Import the Tenant model
import mongoose from 'mongoose'

// Get all properties
export const getProperties = async (req, res) => {
  try {
    const properties = await PropertyRof.find(); // Fetch all properties
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get property details by ID
// Get property details by ID
export const getPropertyDetails = async (req, res) => {
  try {
    const property = await PropertyRof.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if tenant's tenure has ended
    if (property.assignedTenant && new Date(property.assignedTenant.endDate) < new Date()) {
      // Move the tenant to oldTenants array
      property.oldTenants.push(property.assignedTenant);

      // Clear the assignedTenant and mark the property as unassigned
      property.assignedTenant = null;
      property.isAssigned = false;

      // Save the updated property
      await property.save();
    }

    res.json(property);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};




// Assign tenant to a property

// Assign tenant to a property
export const assignTenant = async (req, res) => {
  const { propertyId } = req.params;
  const { tenantName, tenantContact, startDate, totalRent, endDate, rentPaid } = req.body;

  try {
    const property = await PropertyRof.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if the property is already assigned
    if (property.isAssigned && property.assignedTenant) {
      return res.status(400).json({ message: 'Tenant is already assigned to this property' });
    }

    // Check if the endDate is in the future
    if (new Date(endDate) < new Date()) {
      return res.status(400).json({ message: 'End date must be in the future' });
    }

    // Update property with tenant information
    property.isAssigned = true;
    property.assignedTenant = {
      tenantName,
      tenantContact,
      startDate,
      endDate,
      totalRent,
      rentPaid
    };

    await property.save();
    res.json(property);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// controllers/propertyController.js

export const getAssignedProperties = async (req, res) => {
  try {
    // Fetch all properties where isAssigned is true
    const assignedProperties = await PropertyRof.find({ isAssigned: true });
    res.json(assignedProperties); // Return the assigned properties
  } catch (error) {
    console.error('Error fetching assigned properties:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
export const updateRentPaid = async (req, res) => {
  const { propertyId } = req.params;
  const { newRentPaid } = req.body;

  try {
    // Validate newRentPaid
    if (newRentPaid === undefined || newRentPaid === null) {
      return res.status(400).json({ error: 'newRentPaid is required' });
    }

    // Convert newRentPaid to a string and trim any whitespace
    const rentPaidString = newRentPaid.toString().trim();

    // Convert string to number
    const rentPaid = Number(rentPaidString);

    // Check if rentPaid is a valid number
    if (isNaN(rentPaid)) {
      return res.status(400).json({ error: 'Invalid rentPaid value' });
    }

    const property = await PropertyRof.findById(propertyId);

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (!property.isAssigned || !property.assignedTenant) {
      return res.status(400).json({ error: 'No tenant assigned to this property.' });
    }

    // Update the rentPaid field
    property.assignedTenant.rentPaid = rentPaid;

    // Save the updated property to the database
    await property.save();

    return res.json({
      message: 'Rent updated successfully',
      property,
    });
  } catch (error) {
    console.error('Error updating rent:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
// Unassign tenant from a property
export const unassignTenant = async (req, res) => {
  const { propertyId } = req.params;

  try {
    const property = await PropertyRof.findById(propertyId);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (!property.isAssigned || !property.assignedTenant) {
      return res.status(400).json({ message: 'No tenant assigned to this property' });
    }

    // Move the tenant to the oldTenants array
    property.oldTenants.push(property.assignedTenant);
    
    // Clear the assignedTenant field and mark property as unassigned
    property.assignedTenant = null;
    property.isAssigned = false;

    // Save the updated property document
    await property.save();

    return res.json({ message: 'Tenant successfully unassigned and moved to old tenants.' });
  } catch (error) {
    console.error('Error unassigning tenant:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
export const extendTenure = async (req, res) => {
  const { propertyId } = req.params;
  const { newEndDate, newTotalRent } = req.body;

  // Check if both required fields are provided
  if (!newEndDate || !newTotalRent) {
    return res.status(400).json({ message: 'Both newEndDate and newTotalRent are required' });
  }

  try {
    const property = await PropertyRof.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.assignedTenant) {
      // Update the end date and total rent
      property.assignedTenant.endDate = newEndDate;
      property.assignedTenant.totalRent = newTotalRent;

      await property.save();
      return res.json(property);
    } else {
      return res.status(400).json({ message: 'No tenant assigned to this property' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error });
  }
};

// Update Rent Paid for an Old Tenant
export const updateOldTenantRent = async (req, res) => {
  const { propertyId, tenantId } = req.params;
  const { newOldTenantRentPaid } = req.body;

  try {
    // Log received data for debugging
    console.log('Received data:', newOldTenantRentPaid);

    // Validate the request body
    const rentPaid = Number(newOldTenantRentPaid);
    if (isNaN(rentPaid)) {
      return res.status(400).json({ message: 'Invalid rent amount' });
    }

    // Find the property by its ID
    const property = await PropertyRof.findById(propertyId);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Find the specific old tenant by their ID
    const tenantIndex = property.oldTenants.findIndex(tenant => tenant._id.toString() === tenantId);

    if (tenantIndex === -1) {
      return res.status(404).json({ message: 'Old tenant not found' });
    }

    // Update the rentPaid field for the old tenant
    property.oldTenants[tenantIndex].rentPaid = rentPaid;

    // Save the updated property document
    const updatedProperty = await property.save();

    // Log updated property for debugging
    console.log('Updated property:', updatedProperty);

    res.status(200).json({
      message: 'Old tenant rent updated successfully',
      updatedTenant: updatedProperty.oldTenants[tenantIndex]
    });
  } catch (error) {
    console.error('Error updating rent for old tenant:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};










// export const updateRentPaid = async (req, res) => {
//   const { propertyId } = req.params;
//   const { newRentPaid } = req.body;

//   try {
//     const property = await PropertyRof.findById(propertyId);

//     if (!property) {
//       return res.status(404).json({ error: 'Property not found' });
//     }

//     if (!property.isAssigned || !property.assignedTenant) {
//       return res.status(400).json({ error: 'No tenant assigned to this property.' });
//     }

//     // Ensure newRentPaid is converted to a number
//     const rentPaid = Number(newRentPaid);
//     if (isNaN(rentPaid)) {
//       return res.status(400).json({ error: 'Invalid rentPaid value' });
//     }

//     // Update the rentPaid field
//     property.assignedTenant.rentPaid = rentPaid;

//     // Save the updated property to the database
//     await property.save();

//     return res.json({
//       message: 'Rent updated successfully',
//       property,
//     });
//   } catch (error) {
//     console.error('Error updating rent:', error);
//     return res.status(500).json({ error: 'Server error' });
//   }
// };


// export const updateRentPaid = async (req, res) => {
//   const { propertyId } = req.params;
//   const { newRentPaid } = req.body;

//   try {
//     const property = await PropertyRof.findById(propertyId);

//     if (!property) {
//       return res.status(404).json({ message: 'Property not found' });
//     }

//     property.rentPaid = newRentPaid;
//     await property.save();

//     return res.status(200).json({ message: 'Rent updated successfully', property });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };











// Create a new property
// export const createProperty = async (req, res) => {
//   try {
//     const newProperty = new Property(req.body);
//     const savedProperty = await newProperty.save();
//     res.json(savedProperty);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to create property', error });
//   }
// };

// export const latestRentDueProperty = async (req, res) => {
//   try {
//     const properties = await Property.find({ $expr: { $gt: ['$totalRent', '$rentPaid'] } }) // rent due condition
//       .sort({ _id: -1 }) // Sort by the latest added
//       .limit(3);
//     res.json(properties);
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching latest properties with rent due' });
//   }
// } 
// export const latestNearDateProperty = async (req, res) => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // Reset time to midnight
    
//     const fiveDaysFromNow = new Date(today);
//     fiveDaysFromNow.setDate(today.getDate() + 5); // Add 5 days

//     const properties = await Property.find({
//       endDate: {
//         $gte: today,          // Compare with Date objects
//         $lte: fiveDaysFromNow // Compare with Date objects
//       }
//     });

//     console.log('Query Dates - Today:', today, 'Five Days From Now:', fiveDaysFromNow);
//     console.log('Fetched Near End Date Properties:', properties);

//     res.status(200).json(properties);
//   } catch (error) {
//     console.error('Error fetching near-end-date properties:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };











