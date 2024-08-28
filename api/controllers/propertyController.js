// controllers/propertyController.js
import Property from '../models/propertyModel.js';

// Get all properties
export const getProperties = async (req, res) => {
  try {
    const properties = await Property.find();
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch properties', error });
  }
};

// Create a new property
export const createProperty = async (req, res) => {
  try {
    const newProperty = new Property(req.body);
    const savedProperty = await newProperty.save();
    res.json(savedProperty);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create property', error });
  }
};
export const getPropertyDetails = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    console.error('Error fetching property details:', error);
    res.status(500).json({ message: 'Server error' });
  }

}
export const latestRentDueProperty = async (req, res) => {
  try {
    const properties = await Property.find({ $expr: { $gt: ['$totalRent', '$rentPaid'] } }) // rent due condition
      .sort({ _id: -1 }) // Sort by the latest added
      .limit(3);
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching latest properties with rent due' });
  }
} 
export const latestNearDateProperty = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight
    
    const fiveDaysFromNow = new Date(today);
    fiveDaysFromNow.setDate(today.getDate() + 5); // Add 5 days

    const properties = await Property.find({
      endDate: {
        $gte: today,          // Compare with Date objects
        $lte: fiveDaysFromNow // Compare with Date objects
      }
    });

    console.log('Query Dates - Today:', today, 'Five Days From Now:', fiveDaysFromNow);
    console.log('Fetched Near End Date Properties:', properties);

    res.status(200).json(properties);
  } catch (error) {
    console.error('Error fetching near-end-date properties:', error);
    res.status(500).json({ message: 'Server error' });
  }
};











