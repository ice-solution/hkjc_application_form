const mongoose = require('mongoose');

const form1Schema = new mongoose.Schema({
  // 主申請人資料
  surname: {
    type: String,
    required: true,
    trim: true
  },
  givenName: {
    type: String,
    required: true,
    trim: true
  },
  chineseName: {
    type: String,
    trim: true
  },
  titleOfRespect: {
    type: String,
    required: true,
    enum: ['Mr', 'Mrs', 'Ms', 'Miss']
  },
  company: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    trim: true
  },
  mobileCountryCode: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  attend: {
    type: String,
    required: true,
    enum: ['Yes', 'No']
  },
  foodAllergy: {
    type: String,
    trim: true
  },
  privacyConsent: {
    type: Boolean,
    required: true,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Form1', form1Schema);
