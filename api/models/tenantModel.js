import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  assignedProperty: { type: mongoose.Schema.Types.ObjectId, ref: 'PropertyRof' }, // Reference to Property model
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  rentPaid: { type: Number, required: true },
});

export default mongoose.model('Tenant', tenantSchema);


