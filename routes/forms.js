const express = require('express');
const router = express.Router();
const Form1 = require('../models/Form1');
const Form2 = require('../models/Form2');
const Form3 = require('../models/Form3');

// 首頁 - 顯示表單選擇
router.get('/', (req, res) => {
  res.render('index');
});

// Form 1 Routes
router.get('/form1', (req, res) => {
  res.render('form1');
});

router.post('/form1', async (req, res) => {
  try {
    const formData = {
      surname: req.body.surname,
      givenName: req.body.givenName,
      chineseSurname: req.body.chineseSurname || '',
      chineseGivenName: req.body.chineseGivenName || '',
      titleOfRespect: req.body.titleOfRespect,
      company: req.body.company || '',
      title: req.body.title || '',
      mobile: req.body.mobile || '',
      mobileCountryCode: req.body.mobileCountryCode || '',
      email: req.body.email,
      attend: req.body.attend,
      foodAllergy: req.body.foodAllergy || '',
      privacyConsent: req.body.privacyConsent === 'on' || req.body.privacyConsent === true
    };

    const form1 = new Form1(formData);
    await form1.save();
    res.render('success', { formType: 'Form 1', message: '表單提交成功！' });
  } catch (error) {
    console.error('Form 1 提交錯誤:', error);
    res.render('form1', { error: '提交失敗，請檢查所有必填欄位' });
  }
});

// Form 2 Routes
router.get('/form2', (req, res) => {
  res.render('form2');
});

router.post('/form2', async (req, res) => {
  try {
    const formData = {
      surname: req.body.surname,
      givenName: req.body.givenName,
      chineseSurname: req.body.chineseSurname || '',
      chineseGivenName: req.body.chineseGivenName || '',
      titleOfRespect: req.body.titleOfRespect,
      company: req.body.company || '',
      title: req.body.title || '',
      mobile: req.body.mobile || '',
      mobileCountryCode: req.body.mobileCountryCode || '',
      email: req.body.email,
      attend: req.body.attend,
      foodAllergy: req.body.foodAllergy || '',
      withSpouse: req.body.withSpouse,
      privacyConsent: req.body.privacyConsent === 'on' || req.body.privacyConsent === true
    };

    // 如果選擇攜眷，則需要填寫配偶資料
    if (req.body.withSpouse === 'Yes') {
      // 驗證 email 唯一性
      if (req.body.email.toLowerCase() === req.body.spouseEmail.toLowerCase()) {
        return res.render('form2', { error: '所有出席者的電郵地址必須各不相同' });
      }

      formData.spouse = {
        surname: req.body.spouseSurname,
        givenName: req.body.spouseGivenName,
        titleOfRespect: req.body.spouseTitleOfRespect,
        mobile: req.body.spouseMobile || '',
        email: req.body.spouseEmail,
        foodAllergy: req.body.spouseFoodAllergy || ''
      };
    } else {
      // 如果選擇不攜眷，spouse 設為 null
      formData.spouse = null;
    }

    const form2 = new Form2(formData);
    await form2.save();
    res.render('success', { formType: 'Form 2', message: '表單提交成功！' });
  } catch (error) {
    console.error('Form 2 提交錯誤:', error);
    res.render('form2', { error: '提交失敗，請檢查所有必填欄位' });
  }
});

// Form 3 Routes
router.get('/form3', (req, res) => {
  res.render('form3');
});

router.post('/form3', async (req, res) => {
  try {
    const formData = {
      surname: req.body.surname,
      givenName: req.body.givenName,
      chineseSurname: req.body.chineseSurname || '',
      chineseGivenName: req.body.chineseGivenName || '',
      titleOfRespect: req.body.titleOfRespect,
      company: req.body.company || '',
      title: req.body.title || '',
      mobile: req.body.mobile || '',
      mobileCountryCode: req.body.mobileCountryCode || '',
      email: req.body.email,
      attend: req.body.attend,
      foodAllergy: req.body.foodAllergy || '',
      withSpouse: req.body.withSpouse,
      withChildren: req.body.withChildren,
      numberOfChildren: req.body.numberOfChildren ? parseInt(req.body.numberOfChildren) : null,
      privacyConsent: req.body.privacyConsent === 'on' || req.body.privacyConsent === true
    };

    // 收集所有 email 用於驗證唯一性
    const emails = [req.body.email.toLowerCase()];

    // 如果選擇攜眷，則需要填寫配偶資料
    if (req.body.withSpouse === 'Yes') {
      formData.spouse = {
        surname: req.body.spouseSurname,
        givenName: req.body.spouseGivenName,
        chineseSurname: req.body.spouseChineseSurname || '',
        chineseGivenName: req.body.spouseChineseGivenName || '',
        titleOfRespect: req.body.spouseTitleOfRespect,
        mobile: req.body.spouseMobile || '',
        mobileCountryCode: req.body.spouseMobileCountryCode || '',
        email: req.body.spouseEmail,
        foodAllergy: req.body.spouseFoodAllergy || ''
      };
      emails.push(req.body.spouseEmail.toLowerCase());
    } else {
      formData.spouse = null;
    }

    // 如果選擇攜同子女
    if (req.body.withChildren === 'Yes' && req.body.numberOfChildren) {
      const numberOfChildren = parseInt(req.body.numberOfChildren);
      
      // 如果選擇 1 個或以上，填寫 child1
      if (numberOfChildren >= 1) {
        formData.child1 = {
          surname: req.body.child1Surname,
          givenName: req.body.child1GivenName,
          chineseSurname: req.body.child1ChineseSurname || '',
          chineseGivenName: req.body.child1ChineseGivenName || '',
          titleOfRespect: req.body.child1TitleOfRespect,
          mobile: req.body.child1Mobile || '',
          mobileCountryCode: req.body.child1MobileCountryCode || '',
          email: req.body.child1Email,
          foodAllergy: req.body.child1FoodAllergy || ''
        };
        emails.push(req.body.child1Email.toLowerCase());
      } else {
        formData.child1 = null;
      }
      
      // 如果選擇 2 個，填寫 child2
      if (numberOfChildren >= 2) {
        formData.child2 = {
          surname: req.body.child2Surname,
          givenName: req.body.child2GivenName,
          chineseSurname: req.body.child2ChineseSurname || '',
          chineseGivenName: req.body.child2ChineseGivenName || '',
          titleOfRespect: req.body.child2TitleOfRespect,
          mobile: req.body.child2Mobile || '',
          mobileCountryCode: req.body.child2MobileCountryCode || '',
          email: req.body.child2Email,
          foodAllergy: req.body.child2FoodAllergy || ''
        };
        emails.push(req.body.child2Email.toLowerCase());
      } else {
        formData.child2 = null;
      }
    } else {
      formData.child1 = null;
      formData.child2 = null;
    }

    // 驗證 email 唯一性
    const uniqueEmails = [...new Set(emails)];
    if (emails.length !== uniqueEmails.length) {
      return res.render('form3', { error: '所有出席者的電郵地址必須各不相同' });
    }

    const form3 = new Form3(formData);
    await form3.save();
    res.render('success', { formType: 'Form 3', message: '表單提交成功！' });
  } catch (error) {
    console.error('Form 3 提交錯誤:', error);
    res.render('form3', { error: '提交失敗，請檢查所有必填欄位' });
  }
});

module.exports = router;
