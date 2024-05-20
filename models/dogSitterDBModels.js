// File that contains requests schema for the model
// Schema is defined separately and exported as a Mongoose model

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Request schema
const requestSchema = new Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Owner',
        required: true
    },
    sitter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sitter'
    },
    dates: {
        start: Date,
        end: Date
    },
    overnightStay: Boolean,
    numberOfVisitsPerDay: Number,
    numberOfAnimals: Number,
    additionalTasks: {type: String, default: ''},
    houseRules: {type: String, default: ''},
    location: {type: String, default: ''},
    status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Request = mongoose.model('Request', requestSchema);

module.exports = {Request};
