import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  propertyName: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String },
  isAssigned: { type: Boolean, default: false },
  assignedTenant: {
    tenantName: { type: String },
    tenantContact: { type: Number },
    startDate: { type: Date },
    endDate: { type: Date },
    totalRent: { type: Number },
    rentPaid: { type: Number }
  },
  oldTenants: [
    {
      tenantName: { type: String },
      tenantContact: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      totalRent: { type: Number },
      rentPaid: { type: Number }
    }
  ]
});

// Virtual field to calculate rent due
propertySchema.virtual('rentDue').get(function() {
  if (!this.assignedTenant || !this.assignedTenant.totalRent || !this.assignedTenant.rentPaid) {
    return 0;
  }

  return this.assignedTenant.totalRent - this.assignedTenant.rentPaid;
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
propertySchema.methods.unassignTenant = function () {
  if (this.assignedTenant) {
    // Push the current tenant into the oldTenants array
    this.oldTenants.push(this.assignedTenant);

    // Clear the assigned tenant data
    this.assignedTenant = {};
    this.isAssigned = false;

    return this.save();
  }

  return Promise.reject(new Error("No tenant assigned to unassign."));
};

const PropertyRof = mongoose.model('PropertyRof', propertySchema);
export default PropertyRof;





