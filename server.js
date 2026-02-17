require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// 連接 MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rsvp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB 連接成功'))
.catch(err => console.error('MongoDB 連接失敗:', err));

// 設定視圖引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 靜態檔案
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session 配置
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // 在生產環境中使用 HTTPS 時設為 true
    maxAge: 24 * 60 * 60 * 1000 // 24 小時
  }
}));

// Routes
const formRoutes = require('./routes/forms');
const albumRoutes = require('./routes/albums');
app.use('/', formRoutes);
app.use('/', albumRoutes);

app.listen(PORT, () => {
  console.log(`伺服器運行在 http://localhost:${PORT}`);
});







