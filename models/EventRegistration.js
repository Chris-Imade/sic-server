const mongoose = require("mongoose");

const eventRegistrationSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  attendanceType: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("EventRegistration", eventRegistrationSchema);
