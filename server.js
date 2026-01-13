require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

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

// Routes
const formRoutes = require('./routes/forms');
app.use('/', formRoutes);

app.listen(PORT, () => {
  console.log(`伺服器運行在 http://localhost:${PORT}`);
});

