# מערכת הפיקדון והסמכתאות - Meymad

## 🎯 סקירה כללית

מערכת Meymad כוללת מערכת פיקדון מתקדמת עם תמיכה בהעלאת ובדיקה אוטומטית של הסמכתאות בנקאיות באמצעות בינה מלאכותית.

## 💰 מערכת הפיקדון

### סטטוסים
- **`pending`** - ממתין לאישור מנהל
- **`awaiting_deposit`** - ממתין לתשלום פיקדון
- **`deposit_expired`** - פיקדון פג תוקף
- **`approved`** - אושר

### זמני דדליין
- **דדליין פיקדון**: דקה אחת (ניתן לשינוי ב-`server/service/reservations.service.js` שורה 207)
- **אוטומטי**: כשפיקדון פג תוקף, הסטטוס חוזר ל"ממתין לאישור"

## 📄 מערכת הסמכתאות החדשה

### סטטוסים חדשים
- **`receipt_under_review`** - הסמכתא בבדיקה
- **`receipt_verified`** - הסמכתא אושרה

### תכונות
- **העלאת תמונות** - תמיכה ב-JPG, PNG, GIF (מקסימום 5MB)
- **זיהוי אוטומטי** - Tesseract.js מזהה טקסט בעברית ואנגלית
- **ניתוח חכם** - חילוץ אוטומטי של סכום, תאריך ושם
- **אישור אוטומטי** - אם הסכום תואם, ההזמנה מאושרת אוטומטית

### זרימת עבודה
1. **משתמש מעלה הסמכתא** → סטטוס: `receipt_under_review`
2. **בינה מלאכותית מנתחת** → חילוץ פרטים
3. **בדיקה אוטומטית** → השוואת סכומים
4. **אישור אוטומטי** → סטטוס: `receipt_verified` + `approved`

## 🛠️ טכנולוגיות

### Frontend
- **React** + **Material-UI**
- **Tesseract.js** - זיהוי טקסט בתמונות
- **dayjs** - ניהול תאריכים עם תמיכה בזמן מקומי

### Backend
- **Node.js** + **Express**
- **MySQL** - מסד נתונים
- **Multer** - העלאת קבצים
- **JWT** - אימות משתמשים

## 📁 מבנה הקבצים

### קומפוננטות חדשות
- `client/src/component/orders/ReceiptUploader.jsx` - קומפוננטה להעלאת הסמכתאות
- `server/middleware/upload.middleware.js` - middleware להעלאת קבצים

### נתיבים חדשים
- `POST /reservations/:id/upload-receipt` - העלאת הסמכתא
- `POST /reservations/:id/verify-receipt` - אישור הסמכתא

### שדות חדשים בטבלה
```sql
ALTER TABLE reservations ADD COLUMN receipt_status ENUM('pending', 'receipt_under_review', 'receipt_verified') DEFAULT 'pending';
ALTER TABLE reservations ADD COLUMN receipt_file_path VARCHAR(500) NULL;
ALTER TABLE reservations ADD COLUMN receipt_analyzed_at TIMESTAMP NULL;
ALTER TABLE reservations ADD COLUMN receipt_analysis_data JSON NULL;
```

## 🚀 התקנה והפעלה

### 1. התקנת חבילות
```bash
# Frontend
cd client
npm install tesseract.js

# Backend
cd server
npm install multer
```

### 2. עדכון מסד הנתונים
```bash
cd database
node databaseInitialization.js
```

### 3. הפעלת השרתים
```bash
# Backend
cd server
npm start

# Frontend
cd client
npm run dev
```

## 🔧 הגדרות

### שינוי דדליין פיקדון
ערוך את הקובץ `server/service/reservations.service.js` שורה 207:
```javascript
// לדקה אחת
const deadline = dayjs().add(1, 'minute').format('YYYY-MM-DD HH:mm:ss');

// ל-12 שעות
const deadline = dayjs().add(12, 'hours').format('YYYY-MM-DD HH:mm:ss');

// ליום אחד
const deadline = dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss');
```

### שינוי גודל קובץ מקסימלי
ערוך את הקובץ `server/middleware/upload.middleware.js`:
```javascript
limits: {
    fileSize: 10 * 1024 * 1024, // 10MB במקום 5MB
    files: 1
}
```

## 🎨 עיצוב ו-UX

### תכונות עיצוב
- **גרדיאנטים יפים** - רקעים עם אנימציות
- **אנימציות חלקות** - Fade, Slide, Staggered
- **תצוגה מקדימה** - תמונות עם אפשרות מחיקה
- **פס התקדמות** - מעקב אחר עיבוד המסמך
- **הודעות חכמות** - הצלחה, שגיאות ואזהרות

### תמיכה בשפות
- **עברית** - זיהוי טקסט בעברית
- **אנגלית** - זיהוי טקסט באנגלית
- **ערבית** - תמיכה בעתיד

## 🔒 אבטחה

### הגנות
- **אימות משתמשים** - JWT tokens
- **הרשאות** - בדיקת בעלות על הזמנות
- **סינון קבצים** - רק תמונות מותרות
- **גודל מקסימלי** - מניעת DDoS

## 📊 ביצועים

### אופטימיזציות
- **עיבוד מקומי** - Tesseract.js עובד בדפדפן
- **שמירת קבצים** - קבצים נשמרים בשרת
- **ניתוח חכם** - חילוץ מידע רלוונטי בלבד

## 🚧 פיתוחים עתידיים

### תכונות מתוכננות
- **זיהוי שטרות** - זיהוי אוטומטי של שטרות כסף
- **OCR מתקדם** - שיפור דיוק הזיהוי
- **אימות בנקאי** - חיבור ישיר לבנקים
- **הודעות SMS** - התראות על סטטוס פיקדון

## 📞 תמיכה

לשאלות ותמיכה טכנית, פנה לצוות הפיתוח של Meymad.

---

**גרסה**: 2.0.0  
**תאריך עדכון**: 2025  
**מפתח**: צוות Meymad 