const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const fs = require('fs');
const path = require('path');

// 初始化 AWS SES Client
const sesClient = new SESClient({
  region: process.env.AWS_SES_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
  },
});

// 讀取郵件模板
function getEmailTemplate(templateName) {
  const templatePath = path.join(__dirname, '../emailTemplate', templateName);
  console.log(`[EmailService] 嘗試讀取模板: ${templatePath}`);
  
  try {
    // 檢查檔案是否存在
    if (!fs.existsSync(templatePath)) {
      console.error(`[EmailService] 模板檔案不存在: ${templatePath}`);
      return null;
    }
    
    // 檢查檔案大小
    const stats = fs.statSync(templatePath);
    console.log(`[EmailService] 模板檔案大小: ${stats.size} bytes`);
    
    if (stats.size === 0) {
      console.error(`[EmailService] 模板檔案為空: ${templatePath}`);
      return null;
    }
    
    const content = fs.readFileSync(templatePath, 'utf8');
    console.log(`[EmailService] 成功讀取模板，內容長度: ${content.length} 字元`);
    return content;
  } catch (error) {
    console.error(`[EmailService] 無法讀取郵件模板 ${templateName}:`, error);
    console.error(`[EmailService] 錯誤詳情:`, {
      message: error.message,
      code: error.code,
      path: templatePath
    });
    return null;
  }
}

// 發送郵件
async function sendEmail(to, subject, htmlBody) {
  try {
    const fromEmail = process.env.FROM_EMAIL || 'noreply@example.com';
    console.log(`[EmailService] 準備發送郵件 - From: ${fromEmail}, To: ${to}, Subject: ${subject}`);
    
    if (!fromEmail || fromEmail === 'noreply@example.com') {
      console.warn('[EmailService] 警告: FROM_EMAIL 未設定或使用預設值，請在 .env 中設定 FROM_EMAIL');
    }

    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    console.log('[EmailService] 發送 AWS SES 請求...');
    const response = await sesClient.send(command);
    console.log('[EmailService] 郵件發送成功! MessageId:', response.MessageId);
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error('[EmailService] 郵件發送失敗:', error);
    console.error('[EmailService] 錯誤詳情:', {
      name: error.name,
      message: error.message,
      code: error.Code,
      statusCode: error.$metadata?.httpStatusCode
    });
    return { success: false, error: error.message };
  }
}

// 根據出席狀態發送對應的郵件
async function sendAttendanceEmail(email, attend) {
  console.log(`[EmailService] 開始處理郵件發送 - Email: ${email}, Attend: ${attend}`);
  
  // 如果沒有設定 AWS SES，跳過發送郵件
  if (!process.env.AWS_SES_ACCESS_KEY_ID || !process.env.AWS_SES_SECRET_ACCESS_KEY) {
    console.log('[EmailService] AWS SES 未設定，跳過郵件發送');
    console.log('[EmailService] AWS_SES_ACCESS_KEY_ID:', process.env.AWS_SES_ACCESS_KEY_ID ? '已設定' : '未設定');
    console.log('[EmailService] AWS_SES_SECRET_ACCESS_KEY:', process.env.AWS_SES_SECRET_ACCESS_KEY ? '已設定' : '未設定');
    return { success: false, error: 'AWS SES 未設定' };
  }

  let templateName;
  let subject;

  if (attend === 'Yes') {
    templateName = 'replyyes.html';
    subject = 'Registration Confirmation - 登記確認';
  } else if (attend === 'No') {
    templateName = 'replyno.html';
    subject = 'Thank You for Your Reply - 感謝您的回覆';
  } else {
    console.log(`[EmailService] 無效的出席狀態: ${attend}`);
    return { success: false, error: '無效的出席狀態' };
  }

  console.log(`[EmailService] 使用模板: ${templateName}`);
  const htmlBody = getEmailTemplate(templateName);
  
  if (!htmlBody) {
    console.error(`[EmailService] 無法讀取郵件模板: ${templateName}`);
    return { success: false, error: '無法讀取郵件模板' };
  }

  console.log(`[EmailService] 郵件模板讀取成功，準備發送郵件給 ${email}`);
  return await sendEmail(email, subject, htmlBody);
}

module.exports = {
  sendEmail,
  sendAttendanceEmail,
};

