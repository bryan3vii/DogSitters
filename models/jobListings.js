const mongoose = require('mongoose');

// Define the schema for the Job model
const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  salary: {
    type: Number,
    required: true
  },
  salaryRange: {
    type: String,
    enum: ['< $19', '$20 - $29', '$30 - $39', '> $40']
  },
  jobType: {
    type: String,
    enum: ['Stay at home', 'Evening', 'Morning']
  }
  // Add more fields as needed
});

// Create the Job model using the schema
const Job = mongoose.model('Job', jobSchema);

module.exports = Job;