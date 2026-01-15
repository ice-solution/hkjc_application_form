# RSVP Application Forms

這是一個使用 Express.js + Mongoose + EJS + Tailwind CSS + MongoDB 建立的 RSVP 申請表單系統。

## 功能

- **Form 1**: 基本資料表單（含個人資料私隱同意）
- **Form 2**: 基本資料 + 攜眷資料
- **Form 3**: 基本資料 + 攜眷 + 小孩資料（可動態添加多個小孩）

## 安裝步驟

1. 安裝依賴套件：
```bash
npm install
```

2. 設定環境變數：
```bash
cp .env.example .env
```

編輯 `.env` 檔案，設定 MongoDB 連接字串：
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/rsvp
```

3. 確保 MongoDB 正在運行（本地或遠端）

4. 啟動伺服器：
```bash
npm run dev
```

或使用生產模式：
```bash
npm start
```

5. 在瀏覽器開啟：`http://localhost:3000`

## 專案結構

```
firework_application/
├── models/          # Mongoose models
│   ├── Form1.js
│   ├── Form2.js
│   └── Form3.js
├── routes/          # Express routes
│   └── forms.js
├── views/           # EJS 視圖檔案
│   ├── index.ejs
│   ├── form1.ejs
│   ├── form2.ejs
│   ├── form3.ejs
│   └── success.ejs
├── public/          # 靜態檔案
├── server.js        # Express 伺服器主檔案
├── package.json
└── .env             # 環境變數（需自行建立）
```

## 技術棧

- **後端**: Express.js
- **資料庫**: MongoDB + Mongoose
- **視圖引擎**: EJS
- **樣式**: Tailwind CSS + Material Icons
- **開發工具**: Nodemon

## 資料庫 Collections

- `form1s` - Form 1 的資料
- `form2s` - Form 2 的資料
- `form3s` - Form 3 的資料

## 注意事項

- 所有表單欄位都有必填驗證
- Form 3 可以動態添加多個小孩資料
- 所有表單都需要同意個人資料私隱政策才能提交


