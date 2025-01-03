import PropertyRof from '../models/propertyModel.js';
import Tenant from '../models/tenantModel.js'; // Import the Tenant model
import mongoose from 'mongoose'
import cron from 'node-cron';


// Create a new property
export const createProperty = async (req, res) => {

  
  try {
    const { propertyName, location, price } = req.body;

    // Check if required fields are provided
    if (!propertyName || !location || !price) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Create new property
    const newProperty = new PropertyRof({
      propertyName,
      location,
      price,
    });

    await newProperty.save();
    res.status(201).json(newProperty);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ message: 'Error creating property.' });
  }
};







// Get all properties
export const getProperties = async (req, res) => {
  try {
    const properties = await PropertyRof.find(); // Fetch all properties

    // Convert image Buffer to Base64-encoded string
    // properties.forEach((property) => {
    //   if (property.image && Buffer.isBuffer(property.image.data)) {
    //     property.image = property.image.data.toString('base64');
    //   }
    // });

    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};




// Get property details by ID
export const getPropertyDetails = async (req, res) => {

  const { id } = req.params;
  try {
    const property = await PropertyRof.findById(id)
      .populate('assignedTenant.tenant') // Populate the tenant details
      .populate('oldTenants.tenant');

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
    console.log(property.rentDue);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};


// Assign a tenant to a property (old)
// export const assignTenantToProperty = async (req, res) => {
//   const { tenantId, rentPaid, startDate, totalRent, endDate, startingElectricityUnit, rupeesPerUnit } = req.body;

//   try {
//     const property = await PropertyRof.findById(req.params.id);
//     if (!property) {
//       return res.status(404).json({ message: 'Property not found' });
//     }

//     const tenant = await Tenant.findById(tenantId);
//     if (!tenant) {
//       return res.status(404).json({ message: 'Tenant not found' });
//     }

//     // Initialize assignedTenant if not already initialized
//     if (!property.assignedTenant) {
//       property.assignedTenant = {};
//     }

//     // Assign tenant to property with initialized rentHistory and electricityHistory
//     property.assignedTenant = {
//       tenant: tenantId,
//       rentPaid,
//       totalRent,             // monthly rent
//       totalRentPaid: 0,
//       rent: 0,
//       startDate,
//       endDate,
//       rentHistory: property.assignedTenant.rentHistory || [], // Use existing array or initialize a new one
//       startingElectricityUnit,
//       rupeesPerUnit,  
//       electricityUsage: property.assignedTenant.electricityUsage || [], 
//     };

//     if (!property.assignedTenant.electricityUsage) {
//       property.assignedTenant.electricityUsage = [];
//     }
    

//     property.isAssigned = true;
   
//     tenant.assignedProperty = req.params.id;
//     tenant.isAssigned = true ;

//     // Check the assignedTenant object to debug
//     console.log("Assigned Tenant before saving:", property.assignedTenant);

//     const today = new Date();
//     const isStartDateToday = new Date(startDate).toDateString() === today.toDateString();

//     // If the start date is today, update rent history and electricity history
//     if (isStartDateToday) {
//       // Check rentHistory before pushing
//       console.log("rentHistory before push:", property.assignedTenant.rentHistory);
//       property.assignedTenant.rentHistory.push({
//         month: today.toLocaleString('default', { month: 'long' }),
//         year: today.getFullYear(),
//         youGave: totalRent,
//         youGet: 0, // Initial rent paid is 0
//         amount: totalRent - 0 // Amount is calculated as youGave - youGet
//       });

//       // Check electricityHistory before pushing
//       console.log("electricityHistory before push:", property.assignedTenant.electricityUsage);
//       property.assignedTenant.electricityUsage.push({
//         month: today.toLocaleString('default', { month: 'long' }),
//         year: today.getFullYear(),
//         startUnit: startingElectricityUnit,
//         endUnit: 0, // Initially 0, to be updated by the provider
//         unitsUsed: 0, // Not calculated yet
//         electricityCharge: 0, // Not calculated yet
//         isPaid: false // Electricity bill is unpaid initially
//       });
//     }

//     await property.save();
//     await tenant.save();
//     res.status(200).json({ property, tenant });
//   } catch (error) {
//     console.error('Error assigning tenant:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };
// New
export const assignTenantToProperty = async (req, res) => {
  const { tenantId, rentPaid, startDate, totalRent, endDate, startingElectricityUnit, rupeesPerUnit } = req.body;

  try {
    const property = await PropertyRof.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Initialize assignedTenant if not already initialized
    if (!property.assignedTenant) {
      property.assignedTenant = {};
    }

    // Assign tenant to property with initialized rentHistory and electricityHistory
    property.assignedTenant = {
      tenant: tenantId,
      rentPaid,
      totalRent,             // monthly rent
      totalRentPaid: 0,
      rent: 0,
      startDate,
      endDate,
      rentHistory: property.assignedTenant.rentHistory || [], // Use existing array or initialize a new one
      startingElectricityUnit,
      rupeesPerUnit,  
      electricityUsage: property.assignedTenant.electricityUsage || [], 
    };

    property.isAssigned = true;
    tenant.assignedProperty = req.params.id;
    tenant.isAssigned = true;

    const tenantStartDate = new Date(startDate);
    const currentDate = new Date();

    // Iterate through months from startDate to current date
    let currentMonth = tenantStartDate.getMonth();
    let currentYear = tenantStartDate.getFullYear();

    // Keep track of the last endUnit for continuity
    let lastEndUnit = startingElectricityUnit;

    while (currentYear < currentDate.getFullYear() || 
          (currentYear === currentDate.getFullYear() && currentMonth <= currentDate.getMonth())) {
      const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

      // Add to rentHistory
      const rentHistoryExists = property.assignedTenant.rentHistory.some(
        (entry) => entry.month === monthName && entry.year === currentYear
      );
      if (!rentHistoryExists) {
        property.assignedTenant.rentHistory.push({
          month: monthName,
          year: currentYear,
          youGave: totalRent,
          youGet: 0, // Initial rent paid is 0
          amount: totalRent - 0 // Amount is calculated as youGave - youGet
        });
      }

      // Add to electricityUsage
      const electricityHistoryExists = property.assignedTenant.electricityUsage.some(
        (entry) => entry.month === monthName && entry.year === currentYear
      );
      
      if (!electricityHistoryExists) {
        // Determine the startUnit based on the previous month's endUnit
        const previousEntry = property.assignedTenant.electricityUsage.slice(-1)[0];
        const startUnit = previousEntry ? previousEntry.endUnit : lastEndUnit;

        property.assignedTenant.electricityUsage.push({
          month: monthName,
          year: currentYear,
          startUnit,
          endUnit: 0, // Initially 0, to be updated by the provider
          unitsUsed: 0, // Not calculated yet
          electricityCharge: 0, // Not calculated yet
          isPaid: false // Electricity bill is unpaid initially
        });

        // Update lastEndUnit to the newly added entry's endUnit (will be 0 initially)
        lastEndUnit = 0; 
      }

      // Move to the next month
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }

    await property.save();
    await tenant.save();
    res.status(200).json({ property, tenant });
  } catch (error) {
    console.error('Error assigning tenant:', error);
    res.status(500).json({ message: 'Server error' });
  }
};







// Get assigned properties with tenant details and rent information
export const getAssignedPropertiesWithDetails = async (req, res) => {
  try {
    // Fetch all properties where isAssigned is true and populate tenant details
    const assignedProperties = await PropertyRof.find({ isAssigned: true })
      .populate('assignedTenant.tenant'); // Ensure 'tenant' is the correct path for population

    // Map the assigned properties to include relevant details
    const result = assignedProperties.map(property => {
      const assignedTenant = property.assignedTenant; // Directly access the assigned tenant object

      return {
        propertyName: property.propertyName,
        tenantName: assignedTenant && assignedTenant.tenant
          ? assignedTenant.tenant.fullName // Use tenant's fullName directly
          : 'No Tenant',
        totalRentPaid: assignedTenant ? assignedTenant.totalRentPaid : 0, // Get totalRentPaid directly
        rent: assignedTenant ? assignedTenant.rent : 0, // Get rent directly
        _id: property._id,
        tenantId : assignedTenant && assignedTenant.tenant ? assignedTenant.tenant._id : ' No Id',
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching assigned properties with details:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


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
    const property = await PropertyRof.findById(propertyId).populate('assignedTenant');
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.assignedTenant) {
      // Update the end date and total rent
      property.assignedTenant.endDate = newEndDate;
      property.assignedTenant.totalRent = newTotalRent;

      await property.save(); // Save the updated property
      const updatedProperty = await property.populate('assignedTenant'); // Ensure you get the latest tenant data
      return res.json(updatedProperty); // Return the full updated property
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



// Update Rent Details for Assigned Property
// Example controller for updating rent details
export const updateRentDetails = async (req, res) => {
  const { propertyId } = req.params; // Extract propertyId from the request parameters
  const { totalRentPaid, rent, tenantId } = req.body; // Destructure rent details and tenantId from the request body

  try {
    const updatedProperty = await PropertyRof.findOneAndUpdate(
      { 
        _id: propertyId, 
        "assignedTenant.tenant": tenantId // Match tenant ID correctly
      },
      {
        $set: {
          "assignedTenant.totalRentPaid": totalRentPaid,
          "assignedTenant.rent": rent,
        }
      },
      { new: true } // Return the updated document
    );

    if (!updatedProperty) {
      return res.status(404).json({ message: 'Property not found or not assigned to tenant' });
    }

    res.status(200).json(updatedProperty);
  } catch (error) {
    console.error('Error updating rent details:', error);
    res.status(500).json({ message: 'Failed to update rent details', error });
  }
};


// Function to update monthly rent for all tenants (Old)
// export const updateMonthlyRent = async () => {
//   try {
//     const properties = await Property.find({ 'assignedTenant.isAssigned': true });
    
//     for (const property of properties) {
//       const { assignedTenant } = property;
//       const currentDate = new Date();
//       const tenantStartDate = new Date(assignedTenant.startDate);
//       const tenantEndDate = new Date(assignedTenant.endDate);
      
//       // Check if the current date is the same day as the start date of the tenant
//       if (currentDate.getDate() === tenantStartDate.getDate() && currentDate <= tenantEndDate) {
//         // Add the monthly rent to the rentHistory
//         const amount = assignedTenant.totalRent - 0; // Assume initially no payment received
//         assignedTenant.rentHistory.push({
//           month: currentDate.toISOString().slice(0, 7), // Format as "YYYY-MM"
//           year: today.getFullYear(),
//           youGave: assignedTenant.totalRent,
//           youGet: 0, // Initially, no payment received
//           amount, // Calculate amount as youGave - youGet
//         });

//         // Update total rent paid
//         assignedTenant.totalRentPaid += assignedTenant.totalRent;

//         await property.save(); // Save the updated property
//       }
//     }
//     console.log('Monthly rent updated successfully.');
//   } catch (error) {
//     console.error('Error updating monthly rent:', error);
//   }
// };

// Function to update monthly rent for all tenants (New)

export const updateMonthlyRent = async () => {
  try {
    const properties = await Property.find({ 'assignedTenant.isAssigned': true });

    for (const property of properties) {
      const { assignedTenant } = property;
      const currentDate = new Date();
      const tenantStartDate = new Date(assignedTenant.startDate);
      const tenantEndDate = new Date(assignedTenant.endDate);

      // Calculate the number of months to add rent history for
      let month = tenantStartDate.getMonth();
      let year = tenantStartDate.getFullYear();

      while (year < currentDate.getFullYear() || (year === currentDate.getFullYear() && month <= currentDate.getMonth())) {
        // Format the month as "YYYY-MM" and check if an entry already exists
        const formattedMonth = `${year}-${String(month + 1).padStart(2, '0')}`;
        const existingEntry = assignedTenant.rentHistory.find(
          (entry) => entry.month === formattedMonth && entry.year === year
        );

        if (!existingEntry && new Date(year, month) <= tenantEndDate) {
          // Add the monthly rent to the rentHistory
          const amount = assignedTenant.totalRent - 0; // Assume initially no payment received
          assignedTenant.rentHistory.push({
            month: formattedMonth,
            year,
            youGave: assignedTenant.totalRent,
            youGet: 0, // Initially, no payment received
            amount, // Calculate amount as youGave - youGet
          });

          // Update total rent paid
          assignedTenant.totalRentPaid += assignedTenant.totalRent;
        }

        // Move to the next month
        month++;
        if (month > 11) {
          month = 0;
          year++;
        }
      }

      await property.save(); // Save the updated property
    }

    console.log('Monthly rent updated successfully.');
  } catch (error) {
    console.error('Error updating monthly rent:', error);
  }
};


// old
// const updateElectricityUsage = async () => {
//   try {
//     const properties = await Property.find({ 'assignedTenant.isAssigned': true });

//     for (const property of properties) {
//       const { assignedTenant } = property;
//       const currentDate = new Date();
//       const tenantStartDate = new Date(assignedTenant.startDate);
//       const tenantEndDate = new Date(assignedTenant.endDate);

//       // Check if the current date is within the tenant's duration
//       if (currentDate >= tenantStartDate && currentDate <= tenantEndDate) {
//         // Fetch the previous month's electricity history to determine start unit
//         const previousMonthHistory = assignedTenant.electricityHistory.slice(-1)[0];
//         const previousEndUnit = previousMonthHistory ? previousMonthHistory.endUnit : assignedTenant.startingElectricityUnit;

//         // Default end unit is 0, to be updated by the provider
//         const startUnit = previousEndUnit; // The end unit of the previous month becomes the start unit for this month
//         const endUnit = 0; // Will be updated by the provider

//         // Calculate the units used for this month (Assuming endUnit will be updated later by the provider)
//         const unitsUsed = endUnit - startUnit;
//         const electricityCharge = unitsUsed * assignedTenant.rupeesPerUnit;

//         // Add the electricity charge and usage for this month to the electricityHistory
//         assignedTenant.electricityHistory.push({
//           month: currentDate.toISOString().slice(0, 7), // Format as "YYYY-MM"
//           year: currentDate.getFullYear(),
//           startUnit,
//           endUnit,
//           unitsUsed,
//           electricityCharge,
//           isPaid: false, // Assume it's not paid yet
//         });

//         // Save the updated property with electricity usage
//         await property.save();
//       }
//     }

//     console.log('Electricity usage updated successfully.');
//   } catch (error) {
//     console.error('Error updating electricity usage:', error);
//   }
// };
//New
const updateElectricityUsage = async () => {
  try {
    const properties = await Property.find({ 'assignedTenant.tenant': { $exists: true } });

    for (const property of properties) {
      const { assignedTenant } = property;

      if (!assignedTenant.startDate) continue; // Skip properties without a start date

      const tenantStartDate = new Date(assignedTenant.startDate);
      const tenantEndDate = assignedTenant.endDate ? new Date(assignedTenant.endDate) : null;
      const today = new Date();

      // Determine the range of months to update
      const monthsToUpdate = [];
      let current = new Date(tenantStartDate);

      while (current <= today && (!tenantEndDate || current <= tenantEndDate)) {
        monthsToUpdate.push({
          month: current.toLocaleString('default', { month: 'long' }),
          year: current.getFullYear(),
        });
        current.setMonth(current.getMonth() + 1); // Move to the next month
      }

      // Maintain continuity of electricity usage
      let lastEndUnit = assignedTenant.startingElectricityUnit || 0; // Start with the initial startingElectricityUnit

      for (const { month, year } of monthsToUpdate) {
        // Check if an entry already exists for this month
        const existingEntry = assignedTenant.electricityUsage.find(
          (usage) => usage.month === month && usage.year === year
        );

        if (!existingEntry) {
          // Create a new entry for this month
          assignedTenant.electricityUsage.push({
            month,
            year,
            startUnit: lastEndUnit, // Use the last endUnit as the startUnit
            endUnit: 0, // Default value
            unitsUsed: 0, // Initially 0 since endUnit is 0
            electricityCharge: 0, // Will be calculated when endUnit is updated
            isPaid: false, // Assume unpaid initially
          });
        } else {
          // Ensure continuity for existing entries
          if (existingEntry.startUnit !== lastEndUnit) {
            existingEntry.startUnit = lastEndUnit;
          }
        }

        // Update lastEndUnit to the endUnit of this entry
        const updatedEntry = assignedTenant.electricityUsage.find(
          (usage) => usage.month === month && usage.year === year
        );
        lastEndUnit = updatedEntry.endUnit || lastEndUnit; // Keep continuity
      }

      // Save the property with updated electricity usage
      await property.save();
    }

    console.log('Electricity usage updated successfully, including continuity checks.');
  } catch (error) {
    console.error('Error updating electricity usage:', error);
  }
};




cron.schedule('0 0 * * *', async () => {
  console.log('Running monthly rent update...');
  await updateMonthlyRent();
  await updateElectricityUsage();
});



// Controller to update the youGave field
export const updateYouGave = async (req, res) => {
  const { propertyId, tenantId } = req.params;
  const { month, youGave } = req.body; // month and new youGave value from request body

  try {
    // Find the property and the assigned tenant
    const property = await PropertyRof.findOne({ _id: propertyId, "assignedTenant.tenant": tenantId });

    if (!property) {
      return res.status(404).json({ message: 'Property or Tenant not found' });
    }

    // Find the specific rentHistory entry for the month
    const rentHistoryEntry = property.assignedTenant.rentHistory.find(entry => entry.month === month);

    if (!rentHistoryEntry) {
      return res.status(404).json({ message: 'Rent history for the specified month not found' });
    }

    // Update the youGave field
    rentHistoryEntry.youGave = youGave;

    // Save the property with the updated rent history
    await property.save();

    res.status(200).json({ message: 'You Gave updated successfully', rentHistory: property.assignedTenant.rentHistory });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};



export const updateYouGet = async (req, res) => {
  const { propertyId, month, newYouGet } = req.body;

  try {
    // Find the property by ID
    const property = await PropertyRof.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found." });
    }

    // Find the rent history entry for the specified month
    const rentDetail = property.assignedTenant.rentHistory.find(r => r.month === month);
    if (!rentDetail) {
      return res.status(404).json({ message: "Rent detail for this month not found." });
    }

    // Update the youGet field
    rentDetail.youGet = newYouGet;

    // Calculate the amount (balance)
    const totalGave = rentDetail.youGave; // Previous you gave amount
    const totalGet = newYouGet; // New you get amount
    rentDetail.amount = totalGave - totalGet; // Calculate new amount (balance)

    // If youGave equals youGet, set amount to zero
    if (totalGave === totalGet) {
      rentDetail.amount = 0;
    }

    // Update totalRentPaid and dueRent
    property.assignedTenant.totalRentPaid += (newYouGet - rentDetail.youGet); // Adjust total rent paid
    property.assignedTenant.dueRent = property.assignedTenant.totalRent - property.assignedTenant.totalRentPaid; // Calculate due rent

    // Save the updated property
    await property.save();

    return res.status(200).json({ message: "You Get updated successfully.", rentDetail });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
//(old)
// export const updateEndUnit = async (req, res) => {
//   const { propertyId, month, newEndUnit } = req.body;

//   try {
//     // Find the property by ID
//     const property = await PropertyRof.findById(propertyId);
//     if (!property) {
//       return res.status(404).json({ message: "Property not found." });
//     }

//     // Find the electricity usage entry for the specified month
//     const electricityDetail = property.assignedTenant.electricityUsage.find(e => e.month === month);
//     if (!electricityDetail) {
//       return res.status(404).json({ message: "Electricity usage detail for this month not found." });
//     }

//     // Update the endUnit field
//     electricityDetail.endUnit = newEndUnit;

//     // Calculate units used and electricity charge
//     electricityDetail.unitsUsed = newEndUnit - electricityDetail.startUnit;
//     electricityDetail.electricityCharge = electricityDetail.unitsUsed * property.assignedTenant.rupeesPerUnit;

//     // Save the updated property
//     await property.save();

//     return res.status(200).json({ message: "End unit updated successfully.", electricityDetail });
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };

// (New)
export const updateEndUnit = async (req, res) => {
  
  const { propertyId, month, year, newEndUnit } = req.body; // Provide month, year, and updated endUnit.

  try {
    // Find the property by ID
    const property = await PropertyRof.findById(propertyId);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const electricityUsage = property.assignedTenant.electricityUsage;

    // Find the current month's record
    const currentMonthIndex = electricityUsage.findIndex(
      (entry) => entry.month === month && entry.year === year
    );

    if (currentMonthIndex === -1) {
      return res.status(404).json({ message: 'Electricity usage record not found for the specified month.' });
    }

    // Validate the previous month (if not the first month)
    if (currentMonthIndex > 0) {
      const previousMonth = electricityUsage[currentMonthIndex - 1];
      if (previousMonth.endUnit === 0) {
        return res.status(400).json({
          message: 'Cannot update this month’s endUnit because the previous month’s endUnit is 0.',
        });
      }
    }

    // Validate the next month
    const nextMonthIndex = currentMonthIndex + 1;

    // Update the current month's endUnit
    electricityUsage[currentMonthIndex].endUnit = newEndUnit;

    // Calculate units used and electricity charge (if applicable)
    const unitsUsed = newEndUnit - electricityUsage[currentMonthIndex].startUnit;
    electricityUsage[currentMonthIndex].unitsUsed = unitsUsed;
    electricityUsage[currentMonthIndex].electricityCharge =
      unitsUsed * (property.assignedTenant.rupeesPerUnit || 0);

    // Update the next month's startUnit (if it exists)
    if (nextMonthIndex < electricityUsage.length) {
      electricityUsage[nextMonthIndex].startUnit = newEndUnit;
    }

    // Mark the electricityUsage as modified
    property.markModified('assignedTenant.electricityUsage');

    // Save the updated property
    await property.save();

    res.status(200).json({
      message: 'Electricity usage updated successfully',
      electricityUsage: property.assignedTenant.electricityUsage,
    });
  } catch (error) {
    console.error('Error updating electricity usage:', error);
    res.status(500).json({ message: 'Failed to update electricity usage' });
  }
};



export const updateElectricityCharge = async (req, res) => {
  const { propertyId, month, newElectricityCharge, isPaid } = req.body;

  try {
    // Find the property by ID
    const property = await PropertyRof.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found." });
    }

    // Find the electricity usage entry for the specified month and year
    const electricityUsage = property.assignedTenant.electricityUsage.find(
      usage => usage.month === month
    );

    if (!electricityUsage) {
      return res.status(404).json({ message: "Electricity usage not found." });
    }

    // If the checkbox is unchecked, revert the charge to the previous charge
    if (!isPaid) {
      electricityUsage.electricityCharge = electricityUsage.previousCharge; // Revert to previous charge
    } else {
      // Save the previous charge for future reversion
      electricityUsage.previousCharge = electricityUsage.electricityCharge;
      electricityUsage.electricityCharge = newElectricityCharge;
    }

    electricityUsage.isPaid = isPaid; // Update the payment status

    // Save the updated property
    await property.save();

    return res.status(200).json({ 
      message: "Electricity charge updated successfully.", 
      updatedCharge: electricityUsage.electricityCharge // Return the updated charge
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Controller function to update property and tenant details (Old)
// export const updatePropertyAndTenantDetails = async (req, res) => {
//   const { propertyId } = req.params;
//   const { location, monthlyRent, securityPaid, startDate, endDate } = req.body;

//   try {
//     // Find the property by ID
//     const property = await PropertyRof.findById(propertyId);

//     if (!property) {
//       return res.status(404).json({ message: 'Property not found' });
//     }

//     // Update property details
//     if (location) property.location = location;
//     if (monthlyRent) property.assignedTenant.totalRent = monthlyRent;
//     if (securityPaid) property.assignedTenant.rentPaid = securityPaid;
//     if (startDate) property.assignedTenant.startDate = new Date(startDate);
//     if (endDate) property.assignedTenant.endDate = new Date(endDate);

//     // Save the updated property
//     await property.save();

//     res.status(200).json({ message: 'Property and tenant details updated successfully', property });
//   } catch (error) {
//     console.error('Error updating property and tenant details:', error);
//     res.status(500).json({ message: 'Failed to update property and tenant details' });
//   }
// };
// New

export const updatePropertyAndTenantDetails = async (req, res) => {
  const { propertyId } = req.params;
  const { location, totalRent, securityPaid, startDate, endDate } = req.body;

  try {
    // Find the property by ID
    const property = await PropertyRof.findById(propertyId);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Update property details
    if (location) property.location = location;
    if (totalRent) property.assignedTenant.totalRent = totalRent;
    if (securityPaid) property.assignedTenant.rentPaid = securityPaid;

    let startDateUpdated = false;

    if (startDate) {
      const newStartDate = new Date(startDate);
      const currentDate = new Date();

      // Check if the startDate has changed
      if (property.assignedTenant.startDate.toISOString() !== newStartDate.toISOString()) {
        // Only update if the start date is different
        property.assignedTenant.startDate = newStartDate;
        startDateUpdated = true;  // Flag that the startDate has been updated

        // Reset electricity usage data if startDate changes
        const updatedElectricityUsage = [];
        let currentMonth = newStartDate.getMonth();
        let currentYear = newStartDate.getFullYear();

        const startingElectricityUnit = property.assignedTenant.startingElectricityUnit || 0;

        let isFirstMonth = true;
        while (
          currentYear < currentDate.getFullYear() ||
          (currentYear === currentDate.getFullYear() && currentMonth <= currentDate.getMonth())
        ) {
          const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

          // Only reset electricity usage for months starting from the new start date
          updatedElectricityUsage.push({
            month: monthName,
            year: currentYear,
            startUnit: isFirstMonth ? startingElectricityUnit : 0,
            endUnit: 0,
            unitsUsed: 0,
            electricityCharge: 0,
            isPaid: false,
          });

          // After the first month, set isFirstMonth to false
          isFirstMonth = false;

          // Move to the next month
          currentMonth++;
          if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
          }
        }

        // Assign the updated electricity usage back to the property
        property.assignedTenant.electricityUsage = updatedElectricityUsage;

        // Mark electricity usage as modified explicitly
        property.markModified('assignedTenant.electricityUsage');
      }
    }

    if (endDate) property.assignedTenant.endDate = new Date(endDate);

    // Generate rent history if it's updated
    const updatedRentHistory = [];
    let currentMonth = new Date(property.assignedTenant.startDate).getMonth();
    let currentYear = new Date(property.assignedTenant.startDate).getFullYear();
    let isFirstMonth = true;

    while (
      currentYear < new Date().getFullYear() ||
      (currentYear === new Date().getFullYear() && currentMonth <= new Date().getMonth())
    ) {
      const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

      // Create rent history for the month
      updatedRentHistory.push({
        month: monthName,
        year: currentYear,
        youGave: property.assignedTenant.totalRent || 0,
        youGet: 0,
        amount: (property.assignedTenant.totalRent || 0) - 0,
      });

      // After the first month, set isFirstMonth to false
      isFirstMonth = false;

      // Move to the next month
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }

    // Assign the updated rent history back to the property
    property.assignedTenant.rentHistory = updatedRentHistory;

    // Mark rent history as modified explicitly
    property.markModified('assignedTenant.rentHistory');

    // Save the updated property
    await property.save();

    res.status(200).json({ message: 'Property and tenant details updated successfully', property });
  } catch (error) {
    console.error('Error updating property and tenant details:', error);
    res.status(500).json({ message: 'Failed to update property and tenant details' });
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











