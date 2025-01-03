import mongoose from 'mongoose';

const electricityUsageSchema = new mongoose.Schema({
  month: { type: String, required: true },   // e.g., "October"
  year: { type: Number, required: true },    // e.g., 2024
  startUnit: { type: Number, required: true },  // Starting reading for the month
  endUnit: { type: Number, required: true },    // Ending reading for the month
  unitsUsed: { type: Number, required: true },  // Calculated as endUnit - startUnit
  electricityCharge: { type: Number, required: true },  // unitsUsed * rupeesPerUnit
  previousCharge: { type: Number, default: 0 },
  isPaid: { type: Boolean, default: false },  // Payment status for this month's usage
  
});




const rentHistorySchema = new mongoose.Schema({
  year: { type: Number, required: true },  // E.g., 2024
  month: { type: String, required: true }, // E.g., "2024-10"
  amount: { type: Number, required: true }, // Amount billed
  youGave: { type: Number, required: true }, // monthly rent assigned
  youGet: { type: Number, default: 0 }, // initial rent paid  

});




const tenantAssignmentSchema = new mongoose.Schema({
  tenant: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tenant' 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalRent: { type: Number, required: true },         // this is monthly rent
  rentPaid: { type: Number, default: 0 },    // this is security paid
  totalRentPaid : { type: Number, default: 0 },           // this is total rent
  rent : { type: Number, default: 0 },                 // this is rent paid till now
  dueRent : { type : Number , default : 0 },
  rentHistory: [rentHistorySchema],


  // Initial meter reading when tenant moves in
  startingElectricityUnit: { type: Number, required: true }, 
  
  // Rupees to charge per unit
  rupeesPerUnit: { type: Number, required: true },
  
  // Array to store monthly electricity usage records
  electricityUsage: [electricityUsageSchema],  
  
});

const propertySchema = new mongoose.Schema({
  propertyName: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  isAssigned: { type: Boolean, default: false },
  
  // Current tenant assignment details
  assignedTenant: tenantAssignmentSchema,

  // Stores previous tenant assignments
  oldTenants: [tenantAssignmentSchema] // Use the same schema for previous tenants
},{ 
  toJSON: { virtuals: true },
  toObject: { virtuals: true } 
});


// Virtual field to calculate rent due
// Virtual field to calculate rent due including unpaid electricity charges
propertySchema.virtual('rentDue').get(function() {
  if (!this.assignedTenant) {
    return 0;
  }

  // Calculate the total rent balance
  const totalYouGave = this.assignedTenant.rentHistory.reduce((sum, month) => sum + (month.youGave || 0), 0);
  const totalYouGet = this.assignedTenant.rentHistory.reduce((sum, month) => sum + (month.youGet || 0), 0);
  const rentBalance = Math.max(totalYouGave - totalYouGet, 0); // Ensures it does not go negative

  // Calculate the total unpaid electricity charges
  const electricityBalance = this.assignedTenant.electricityUsage.reduce((sum, usage) => {
    if (!usage.isPaid) {
      return sum + (usage.electricityCharge || 0);
    }
    return sum;
  }, 0);

  // Total due includes both rent balance and unpaid electricity charges
  return rentBalance + electricityBalance;
});


// Virtual field to calculate near due date
propertySchema.virtual('nearDueDate').get(function() {
  if (!this.assignedTenant || !this.assignedTenant.endDate) {
    return null;
  }

  const today = new Date();
  const endDate = new Date(this.assignedTenant.endDate);
  const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

  return daysRemaining <= 7 ? endDate : null; // Returns endDate if less than or equal to 7 days remaining
});

// Function to unassign the current tenant and move to oldTenants
propertySchema.methods.unassignTenant = async function () {
  if (this.assignedTenant) {
    // Find the current assigned tenant
    const assignedTenant = await mongoose.model('Tenant').findById(this.assignedTenant);

    // Move the current tenant into the oldTenants array with rent info
    this.oldTenants.push({
      tenant: assignedTenant._id,
      startDate: this.assignedTenant.startDate,
      endDate: this.assignedTenant.endDate,
      totalRent: this.assignedTenant.totalRent,
      rentPaid: this.assignedTenant.rentPaid
    });

    // Clear the assigned tenant and mark property as not assigned
    this.assignedTenant = null;
    this.isAssigned = false;

    return this.save();
  }

  return Promise.reject(new Error("No tenant assigned to unassign."));
};

const PropertyRof = mongoose.model('PropertyRof', propertySchema);
export default PropertyRof;






