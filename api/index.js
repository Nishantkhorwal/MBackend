import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config();
import cookieParser from 'cookie-parser';
import cors from 'cors';
import propertyRoutes from './routes/propertyRoutes.js';
import userRoutes from './routes/userRoutes.js';
import tenantRoutes from './routes/tenantRoutes.js';



mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log('Connected to MongoDB');

  })
  .catch((err) => {
    console.log(err);
  });


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser());


app.listen(process.env.PORT, () => {
  console.log('Server listening on port 3000!');
});
app.use('/api/properties', propertyRoutes);
app.use('/api', userRoutes);
app.use('/api/tenants', tenantRoutes);