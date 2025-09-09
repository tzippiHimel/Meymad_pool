# הוראות פריסה ל-Render

## הגדרת השרת ב-Render

### 1. יצירת שירות חדש ב-Render
1. היכנסי ל-Render.com
2. לחצי על "New +" ובחרי "Web Service"
3. חברי את ה-GitHub repository שלך

### 2. הגדרות הפריסה
- **Name**: `meymad-pool-server`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: `server`

### 3. משתני סביבה (Environment Variables)
הוסף את המשתנים הבאים ב-Render:

```
NODE_ENV=production
PORT=10000
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=meymad_pool
DB_PORT=3306
CLIENT_URL=http://localhost:5173
```

### 4. הגדרות נוספות
- **Auto-Deploy**: Yes (עבור main branch)
- **Health Check Path**: `/` (אופציונלי)

## הגדרת הלקוח המקומי

הלקוח כבר מוגדר להתחבר לשרת ב-Render כאשר הוא רץ מקומית.

### הפעלת הלקוח
```bash
cd client
npm install
npm run dev
```

הלקוח יתחבר אוטומטית ל-`https://meymad-pool.onrender.com` כאשר הוא רץ על localhost.

## בדיקת החיבור

1. הפעילי את השרת ב-Render
2. הפעילי את הלקוח מקומית
3. בדקי שהחיבור עובד על ידי פתיחת Developer Tools וראיית בקשות API לשרת ב-Render

## פתרון בעיות נפוצות

### CORS Errors
אם יש שגיאות CORS, וודאי שה-`CLIENT_URL` מוגדר נכון ב-Render.

### Database Connection
וודאי שמשתני הסביבה של המסד נתונים מוגדרים נכון ב-Render.

### Socket.io Connection
אם יש בעיות עם Socket.io, בדקי שה-WebSocket connections מותרים ב-Render.
