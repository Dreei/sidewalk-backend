import express from 'express';
import Report from '../models/report.models.js';
const reportsRouter = express.Router();

// Get all reports
reportsRouter.get('/', async (req, res) => {
  try {
    const reports = await Report.find().populate('location');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new report
reportsRouter.post('/', async (req, res) => {
  const { userType, issueType, description, coordinates, locationId } = req.body;

  try {
    const report = new Report({
      userType,
      issueType,
      description,
      coordinates,
      location: locationId
    });

    const newReport = await report.save();
    res.status(201).json(newReport);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default reportsRouter;
