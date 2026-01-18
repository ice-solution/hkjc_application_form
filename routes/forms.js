const express = require('express');
const router = express.Router();
const Form1 = require('../models/Form1');
const Form2 = require('../models/Form2');
const Form3 = require('../models/Form3');
const { sendAttendanceEmail } = require('../services/emailService');
const XLSX = require('xlsx');

// 檢查 email 是否已在資料庫中註冊
async function checkEmailExists(email) {
  if (!email) return false;
  
  const emailLower = email.toLowerCase().trim();
  
  // 檢查 Form1
  const existsInForm1 = await Form1.findOne({ email: emailLower });
  if (existsInForm1) return true;
  
  // 檢查 Form2 (主申請人和攜眷)
  const existsInForm2 = await Form2.findOne({
    $or: [
      { email: emailLower },
      { 'spouse.email': emailLower }
    ]
  });
  if (existsInForm2) return true;
  
  // 檢查 Form3 (主申請人、攜眷、子女1、子女2)
  const existsInForm3 = await Form3.findOne({
    $or: [
      { email: emailLower },
      { 'spouse.email': emailLower },
      { 'child1.email': emailLower },
      { 'child2.email': emailLower }
    ]
  });
  if (existsInForm3) return true;
  
  return false;
}

// 首頁 - 顯示表單選擇
router.get('/', (req, res) => {
  res.render('index');
});

// 成功頁面
router.get('/success', (req, res) => {
  res.render('success', { 
    formType: '表單', 
    message: '您的表單已成功提交。Your information has been submitted successfully!' 
  });
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

    // 檢查 email 是否已登記
    const emailExists = await checkEmailExists(formData.email);
    if (emailExists) {
      const errorMsg = "此電郵地址此前已用作登記，因此無法再次使用。<br>This email address has already been registered and cannot be used for registration again.";
      // 檢查是否為 AJAX 請求
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(400).json({ success: false, error: errorMsg });
      }
      return res.render('form1', { error: errorMsg });
    }

    const form1 = new Form1(formData);
    await form1.save();
    
    // 發送郵件
    console.log(`準備發送郵件給 ${formData.email}，出席狀態: ${formData.attend}`);
    try {
      const emailResult = await sendAttendanceEmail(formData.email, formData.attend);
      if (emailResult.success) {
        console.log(`郵件發送成功給 ${formData.email}:`, emailResult.messageId);
      } else {
        console.error(`郵件發送失敗給 ${formData.email}:`, emailResult.error);
      }
    } catch (error) {
      console.error('發送郵件時發生錯誤:', error);
      // 即使郵件發送失敗，也不影響表單提交成功
    }
    
    // 檢查是否為 AJAX 請求
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ success: true, message: '表單提交成功！' });
    }
    res.render('success', { formType: 'Form 1', message: '表單提交成功！' });
  } catch (error) {
    console.error('Form 1 提交錯誤:', error);
    const errorMsg = '提交失敗，請檢查所有必填欄位 Submission failed, please fill all the required information';
    // 檢查是否為 AJAX 請求
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(400).json({ success: false, error: errorMsg });
    }
    res.render('form1', { error: errorMsg });
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
      formData.spouse = {
        surname: req.body.spouseSurname,
        givenName: req.body.spouseGivenName,
        titleOfRespect: req.body.spouseTitleOfRespect,
        mobile: req.body.spouseMobile || '',
        email: req.body.spouseEmail,
        foodAllergy: req.body.spouseFoodAllergy || ''
      };
      
      // 檢查攜眷 email 是否已登記
      const spouseEmailExists = await checkEmailExists(formData.spouse.email);
      if (spouseEmailExists) {
        const errorMsg = '此電郵地址此前已用作登記，因此無法再次使用。<br>This email address has already been registered and cannot be used for registration again.';
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
          return res.status(400).json({ success: false, error: errorMsg });
        }
        return res.render('form2', { error: errorMsg });
      }
    } else {
      // 如果選擇不攜眷，spouse 設為 null
      formData.spouse = null;
    }

    // 檢查主申請人 email 是否已登記
    const emailExists = await checkEmailExists(formData.email);
    if (emailExists) {
      const errorMsg = '此電郵地址此前已用作登記，因此無法再次使用。<br>This email address has already been registered and cannot be used for registration again.';
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(400).json({ success: false, error: errorMsg });
      }
      return res.render('form2', { error: errorMsg });
    }

    const form2 = new Form2(formData);
    await form2.save();
    
    // 發送郵件
    console.log(`準備發送郵件給 ${formData.email}，出席狀態: ${formData.attend}`);
    try {
      const emailResult = await sendAttendanceEmail(formData.email, formData.attend);
      if (emailResult.success) {
        console.log(`郵件發送成功給 ${formData.email}:`, emailResult.messageId);
      } else {
        console.error(`郵件發送失敗給 ${formData.email}:`, emailResult.error);
      }
    } catch (error) {
      console.error('發送郵件時發生錯誤:', error);
      // 即使郵件發送失敗，也不影響表單提交成功
    }
    
    // 檢查是否為 AJAX 請求
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ success: true, message: '表單提交成功！' });
    }
    res.render('success', { formType: 'Form 2', message: '表單提交成功！' });
  } catch (error) {
    console.error('Form 2 提交錯誤:', error);
    const errorMsg = '提交失敗，請檢查所有必填欄位 Submission failed, please fill all the required information';
    // 檢查是否為 AJAX 請求
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(400).json({ success: false, error: errorMsg });
    }
    res.render('form2', { error: errorMsg });
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

    // 檢查主申請人 email 是否已登記
    const emailExists = await checkEmailExists(formData.email);
    if (emailExists) {
      const errorMsg = '此電郵地址此前已用作登記，因此無法再次使用。<br>This email address has already been registered and cannot be used for registration again.';
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        return res.status(400).json({ success: false, error: errorMsg });
      }
      return res.render('form3', { error: errorMsg });
    }

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
      
      // 檢查攜眷 email 是否已登記
      const spouseEmailExists = await checkEmailExists(formData.spouse.email);
      if (spouseEmailExists) {
        const errorMsg = '此電郵地址此前已用作登記，因此無法再次使用。<br>This email address has already been registered and cannot be used for registration again.';
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
          return res.status(400).json({ success: false, error: errorMsg });
        }
        return res.render('form3', { error: errorMsg });
      }
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
        
        // 檢查子女1 email 是否已登記
        const child1EmailExists = await checkEmailExists(formData.child1.email);
        if (child1EmailExists) {
          const errorMsg = '此電郵地址此前已用作登記，因此無法再次使用。<br>This email address has already been registered and cannot be used for registration again.';
          if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(400).json({ success: false, error: errorMsg });
          }
          return res.render('form3', { error: errorMsg });
        }
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
        
        // 檢查子女2 email 是否已登記
        const child2EmailExists = await checkEmailExists(formData.child2.email);
        if (child2EmailExists) {
          const errorMsg = '此電郵地址此前已用作登記，因此無法再次使用。<br>This email address has already been registered and cannot be used for registration again.';
          if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(400).json({ success: false, error: errorMsg });
          }
          return res.render('form3', { error: errorMsg });
        }
      } else {
        formData.child2 = null;
      }
    } else {
      formData.child1 = null;
      formData.child2 = null;
    }

    const form3 = new Form3(formData);
    await form3.save();
    
    // 發送郵件
    console.log(`準備發送郵件給 ${formData.email}，出席狀態: ${formData.attend}`);
    try {
      const emailResult = await sendAttendanceEmail(formData.email, formData.attend);
      if (emailResult.success) {
        console.log(`郵件發送成功給 ${formData.email}:`, emailResult.messageId);
      } else {
        console.error(`郵件發送失敗給 ${formData.email}:`, emailResult.error);
      }
    } catch (error) {
      console.error('發送郵件時發生錯誤:', error);
      // 即使郵件發送失敗，也不影響表單提交成功
    }
    
    // 檢查是否為 AJAX 請求
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ success: true, message: '表單提交成功！' });
    }
    res.render('success', { formType: 'Form 3', message: '表單提交成功！' });
  } catch (error) {
    console.error('Form 3 提交錯誤:', error);
    const errorMsg = '提交失敗，請檢查所有必填欄位 Submission failed, please fill all the required information';
    // 檢查是否為 AJAX 請求
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(400).json({ success: false, error: errorMsg });
    }
    res.render('form3', { error: errorMsg });
  }
});

// 匯出 Excel 資料
router.get('/export/excel', async (req, res) => {
  try {
    // 查詢所有表單資料
    const form1Data = await Form1.find().lean();
    const form2Data = await Form2.find().lean();
    const form3Data = await Form3.find().lean();

    // 轉換 Form1 資料為 Excel 格式
    const form1Rows = form1Data.map(item => ({
      '提交時間': item.createdAt ? new Date(item.createdAt).toLocaleString('zh-TW') : '',
      '姓(英文)': item.surname || '',
      '名(英文)': item.givenName || '',
      '姓(中文)': item.chineseSurname || '',
      '名(中文)': item.chineseGivenName || '',
      '稱謂': item.titleOfRespect || '',
      '公司/機構': item.company || '',
      '職銜': item.title || '',
      '區碼': item.mobileCountryCode || '',
      '手提電話': item.mobile || '',
      '電子郵件': item.email || '',
      '出席': item.attend || '',
      '食物敏感': item.foodAllergy || '',
      '私隱同意': item.privacyConsent ? '是' : '否'
    }));

    // 轉換 Form2 資料為 Excel 格式
    const form2Rows = form2Data.map(item => ({
      '提交時間': item.createdAt ? new Date(item.createdAt).toLocaleString('zh-TW') : '',
      '姓(英文)': item.surname || '',
      '名(英文)': item.givenName || '',
      '姓(中文)': item.chineseSurname || '',
      '名(中文)': item.chineseGivenName || '',
      '稱謂': item.titleOfRespect || '',
      '公司/機構': item.company || '',
      '職銜': item.title || '',
      '區碼': item.mobileCountryCode || '',
      '手提電話': item.mobile || '',
      '電子郵件': item.email || '',
      '出席': item.attend || '',
      '食物敏感': item.foodAllergy || '',
      '攜眷': item.withSpouse || '',
      '攜眷-姓(英文)': item.spouse?.surname || '',
      '攜眷-名(英文)': item.spouse?.givenName || '',
      '攜眷-姓(中文)': item.spouse?.chineseSurname || '',
      '攜眷-名(中文)': item.spouse?.chineseGivenName || '',
      '攜眷-稱謂': item.spouse?.titleOfRespect || '',
      '攜眷-區碼': item.spouse?.mobileCountryCode || '',
      '攜眷-手提電話': item.spouse?.mobile || '',
      '攜眷-電子郵件': item.spouse?.email || '',
      '攜眷-食物敏感': item.spouse?.foodAllergy || '',
      '私隱同意': item.privacyConsent ? '是' : '否'
    }));

    // 轉換 Form3 資料為 Excel 格式
    const form3Rows = form3Data.map(item => {
      const row = {
        '提交時間': item.createdAt ? new Date(item.createdAt).toLocaleString('zh-TW') : '',
        '姓(英文)': item.surname || '',
        '名(英文)': item.givenName || '',
        '姓(中文)': item.chineseSurname || '',
        '名(中文)': item.chineseGivenName || '',
        '稱謂': item.titleOfRespect || '',
        '公司/機構': item.company || '',
        '職銜': item.title || '',
        '區碼': item.mobileCountryCode || '',
        '手提電話': item.mobile || '',
        '電子郵件': item.email || '',
        '出席': item.attend || '',
        '食物敏感': item.foodAllergy || '',
        '攜眷': item.withSpouse || '',
        '攜眷-姓(英文)': item.spouse?.surname || '',
        '攜眷-名(英文)': item.spouse?.givenName || '',
        '攜眷-姓(中文)': item.spouse?.chineseSurname || '',
        '攜眷-名(中文)': item.spouse?.chineseGivenName || '',
        '攜眷-稱謂': item.spouse?.titleOfRespect || '',
        '攜眷-區碼': item.spouse?.mobileCountryCode || '',
        '攜眷-手提電話': item.spouse?.mobile || '',
        '攜眷-電子郵件': item.spouse?.email || '',
        '攜眷-食物敏感': item.spouse?.foodAllergy || '',
        '攜同子女': item.withChildren || '',
        '子女數目': item.numberOfChildren || ''
      };

      // 添加子女1的資料
      if (item.child1) {
        row['子女1-姓(英文)'] = item.child1.surname || '';
        row['子女1-名(英文)'] = item.child1.givenName || '';
        row['子女1-姓(中文)'] = item.child1.chineseSurname || '';
        row['子女1-名(中文)'] = item.child1.chineseGivenName || '';
        row['子女1-稱謂'] = item.child1.titleOfRespect || '';
        row['子女1-區碼'] = item.child1.mobileCountryCode || '';
        row['子女1-手提電話'] = item.child1.mobile || '';
        row['子女1-電子郵件'] = item.child1.email || '';
        row['子女1-食物敏感'] = item.child1.foodAllergy || '';
      }

      // 添加子女2的資料
      if (item.child2) {
        row['子女2-姓(英文)'] = item.child2.surname || '';
        row['子女2-名(英文)'] = item.child2.givenName || '';
        row['子女2-姓(中文)'] = item.child2.chineseSurname || '';
        row['子女2-名(中文)'] = item.child2.chineseGivenName || '';
        row['子女2-稱謂'] = item.child2.titleOfRespect || '';
        row['子女2-區碼'] = item.child2.mobileCountryCode || '';
        row['子女2-手提電話'] = item.child2.mobile || '';
        row['子女2-電子郵件'] = item.child2.email || '';
        row['子女2-食物敏感'] = item.child2.foodAllergy || '';
      }

      row['私隱同意'] = item.privacyConsent ? '是' : '否';
      return row;
    });

    // 創建 Excel 工作簿
    const workbook = XLSX.utils.book_new();

    // 將資料轉換為工作表
    if (form1Rows.length > 0) {
      const form1Sheet = XLSX.utils.json_to_sheet(form1Rows);
      XLSX.utils.book_append_sheet(workbook, form1Sheet, 'Form1');
    } else {
      // 即使沒有資料也創建空的 sheet
      const form1Sheet = XLSX.utils.json_to_sheet([{
        '提交時間': '', '姓(英文)': '', '名(英文)': '', '姓(中文)': '', '名(中文)': '',
        '稱謂': '', '公司/機構': '', '職銜': '', '區碼': '', '手提電話': '',
        '電子郵件': '', '出席': '', '食物敏感': '', '私隱同意': ''
      }]);
      XLSX.utils.book_append_sheet(workbook, form1Sheet, 'Form1');
    }

    if (form2Rows.length > 0) {
      const form2Sheet = XLSX.utils.json_to_sheet(form2Rows);
      XLSX.utils.book_append_sheet(workbook, form2Sheet, 'Form2');
    } else {
      const form2Sheet = XLSX.utils.json_to_sheet([{
        '提交時間': '', '姓(英文)': '', '名(英文)': '', '姓(中文)': '', '名(中文)': '',
        '稱謂': '', '公司/機構': '', '職銜': '', '區碼': '', '手提電話': '',
        '電子郵件': '', '出席': '', '食物敏感': '', '攜眷': ''
      }]);
      XLSX.utils.book_append_sheet(workbook, form2Sheet, 'Form2');
    }

    if (form3Rows.length > 0) {
      const form3Sheet = XLSX.utils.json_to_sheet(form3Rows);
      XLSX.utils.book_append_sheet(workbook, form3Sheet, 'Form3');
    } else {
      const form3Sheet = XLSX.utils.json_to_sheet([{
        '提交時間': '', '姓(英文)': '', '名(英文)': '', '姓(中文)': '', '名(中文)': '',
        '稱謂': '', '公司/機構': '', '職銜': '', '區碼': '', '手提電話': '',
        '電子郵件': '', '出席': '', '食物敏感': '', '攜眷': '', '攜同子女': ''
      }]);
      XLSX.utils.book_append_sheet(workbook, form3Sheet, 'Form3');
    }

    // 生成 Excel 緩衝區
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 設置響應頭
    const fileName = `rsvp_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);

    // 發送檔案
    res.send(excelBuffer);
  } catch (error) {
    console.error('匯出 Excel 錯誤:', error);
    res.status(500).json({ error: '匯出 Excel 失敗', message: error.message });
  }
});

module.exports = router;
