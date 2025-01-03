import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  fatherName: { type: String, required: true },
  spouseName: { type: String }, // Not required
  occupation: { type: String, required: true },
  nationality: { type: String, required: true },
  age: { type: Number, required: true },
  sex: { type: String, required: true },
  caste: { type: String, required: true },
  houseNo: { type: String, required: true },
  sectorVillageLocality: { type: String, required: true },
  policeStation: { type: String, required: true },
  districtAndState: { type: String, required: true },
  landlineOrMobile: { type: String, required: true },
  natureOfEmployment: { type: String, required: true },
  assignedProperty: { type: mongoose.Schema.Types.ObjectId, ref: 'PropertyRof' }, // Reference to Property model
  passportPhoto: { type: String }, // Path to the passport-size photo
  signature: { type: String }, // Path to the scanned signature
  isAssigned: { type: Boolean, default: false }
});

export default mongoose.model('Tenant', tenantSchema);



