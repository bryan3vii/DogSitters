const mongoose = require('mongoose');

// Define the schema for job listings
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
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract'],
    required: true
  }
});

// Create a model for job listings using the schema
const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
