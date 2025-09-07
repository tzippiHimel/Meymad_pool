const multer = require('multer');
const path = require('path');
const fs = require('fs');

// יצירת תיקייה לשמירת קבצים אם לא קיימת
const uploadDir = path.join(__dirname, '../uploads/receipts');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// הגדרת שמירת קבצים
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // שם קובץ ייחודי עם תאריך
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'receipt-' + uniqueSuffix + ext);
    }
});

// פילטר קבצים - תמונות או PDF
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('רק קבצי תמונה או PDF מותרים'), false);
    }
};

// הגדרת multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // מקסימום 10MB כדי לתמוך גם ב-PDF
        files: 1 // קובץ אחד בלבד
    }
});

module.exports = upload;
