const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Album = require('../models/Album');
const sizeOf = require('image-size');

// 配置 multer 用於文件上傳
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/images/albums');
    // 確保目錄存在
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: function (req, file, cb) {
    // 只允許圖片文件
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允許上傳圖片文件 (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// 登入驗證中間件
function requireAuth(req, res, next) {
  if (req.session && req.session.isAuthenticated) {
    return next();
  }
  res.redirect('/edit_albums/login');
}

// 登入頁面
router.get('/edit_albums/login', (req, res) => {
  res.render('login', { error: null });
});

// 處理登入
router.post('/edit_albums/login', (req, res) => {
  const { username, password } = req.body;
  const correctUsername = process.env.ALBUM_USERNAME || 'admin';
  const correctPassword = process.env.ALBUM_PASSWORD || 'password';
  
  if (username === correctUsername && password === correctPassword) {
    req.session.isAuthenticated = true;
    res.redirect('/edit_albums');
  } else {
    res.render('login', { error: '用戶名或密碼錯誤' });
  }
});

// 登出
router.get('/edit_albums/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('登出錯誤:', err);
    }
    res.redirect('/edit_albums/login');
  });
});

// 相簿頁面（公開）
router.get('/albums', async (req, res) => {
  try {
    const albums = await Album.find().sort({ order: 1, createdAt: -1 });
    res.render('albums', { albums });
  } catch (error) {
    console.error('獲取相簿錯誤:', error);
    res.status(500).send('獲取相簿失敗');
  }
});

// 編輯相簿頁面（需要登入）
router.get('/edit_albums', requireAuth, async (req, res) => {
  try {
    const albums = await Album.find().sort({ order: 1, createdAt: -1 });
    res.render('edit_albums', { albums });
  } catch (error) {
    console.error('獲取相簿錯誤:', error);
    res.status(500).send('獲取相簿失敗');
  }
});

// 上傳圖片（需要登入）
router.post('/edit_albums/upload', requireAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: '沒有上傳文件' });
    }

    const filePath = path.join(__dirname, '../public/images/albums', req.file.filename);
    let dimensions = { width: 0, height: 0 };
    let orientation = 'landscape';

    try {
      dimensions = sizeOf(filePath);
      if (dimensions.width > dimensions.height) {
        orientation = 'landscape';
      } else if (dimensions.height > dimensions.width) {
        orientation = 'portrait';
      } else {
        orientation = 'square';
      }
    } catch (err) {
      console.error('獲取圖片尺寸錯誤:', err);
    }

    const album = new Album({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `/images/albums/${req.file.filename}`,
      size: req.file.size,
      mimeType: req.file.mimetype,
      width: dimensions.width,
      height: dimensions.height,
      orientation: orientation,
      order: 0
    });

    await album.save();
    res.json({ success: true, album });
  } catch (error) {
    console.error('上傳圖片錯誤:', error);
    res.status(500).json({ success: false, error: '上傳失敗' });
  }
});

// 刪除圖片（需要登入）
router.delete('/edit_albums/:id', requireAuth, async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ success: false, error: '圖片不存在' });
    }

    // 刪除文件
    const filePath = path.join(__dirname, '../public', album.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 刪除數據庫記錄
    await Album.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('刪除圖片錯誤:', error);
    res.status(500).json({ success: false, error: '刪除失敗' });
  }
});

// 更新圖片順序（需要登入）
router.put('/edit_albums/order', requireAuth, async (req, res) => {
  try {
    const { orders } = req.body; // [{ id, order }, ...]
    
    for (const item of orders) {
      await Album.findByIdAndUpdate(item.id, { order: item.order });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('更新順序錯誤:', error);
    res.status(500).json({ success: false, error: '更新失敗' });
  }
});

module.exports = router;
