import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  tenantName: { type: String, required: true },
  tenantPhoneNumber: { type: String, required: true },
  propertyName: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalRent: { type: Number, required: true },
  rentPaid: { type: Number, required: true },
  // New field for image link
  imageUrl: { type: String, required: true }, 
});

const Property = mongoose.model('Property', propertySchema);

export default Property;


