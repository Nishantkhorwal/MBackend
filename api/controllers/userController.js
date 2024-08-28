import UserRof from '../models/userModel.js'; // Adjust path as necessary
import bcrypt from 'bcryptjs'; // Make sure bcrypt is installed
import jwt from 'jsonwebtoken'; // JWT for token generation
import dotenv from 'dotenv'; // dotenv for environment variables

dotenv.config(); // Load environment variables

export const registerUser = async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
  
    try {
      // Check if passwords match
      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }
  
      // Check if the user already exists
      const existingUser = await UserRof.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      // Create a new user
      const newUser = new UserRof({
        name,
        email,
        password: await bcrypt.hash(password, 12), // Hash the password
        isAdmin: false // Set based on your criteria
      });
  
      // Save the user to the database
      const savedUser = await newUser.save();
  
      // Respond with success message
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email,
          isAdmin: savedUser.isAdmin
        }
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Find the user by email
      const user = await UserRof.findOne({ email });
  
      // Check if user exists
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }
  
      // Compare the input password with the hashed password
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, email: user.email, isAdmin: user.isAdmin }, // Payload
        process.env.JWT_SECRET, // Secret key
        { expiresIn: process.env.JWT_EXPIRES_IN } // Expiration time
      );
  
      // Respond with user data and token
      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin
        },
        token
      });
    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };




