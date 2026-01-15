const mongoose = require('mongoose');

const spouseSchema = new mongoose.Schema({
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
  chineseSurname: {
    type: String,
    trim: true
  },
  chineseGivenName: {
    type: String,
    trim: true
  },
  titleOfRespect: {
    type: String,
    required: true,
    enum: ['Mr', 'Mrs', 'Ms', 'Miss']
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
  foodAllergy: {
    type: String,
    trim: true
  }
}, { _id: false });

const form2Schema = new mongoose.Schema({
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
  chineseSurname: {
    type: String,
    trim: true
  },
  chineseGivenName: {
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
  // 攜眷資料
  withSpouse: {
    type: String,
    required: true,
    enum: ['Yes', 'No']
  },
  spouse: {
    type: spouseSchema,
    required: false
  },
  privacyConsent: {
    type: Boolean,
    required: true,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Form2', form2Schema);
