const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const reservationsRoutes = require('./routes/reservations.routes');
const commentsRoutes = require('./routes/comments.routes');
const userRoutes = require('./routes/users.routes');
const authRoutes = require('./routes/auth.routes');
const messagesRoutes = require('./routes/messages.routes');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const reservationService = require('./service/reservations.service');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173', 
    credentials: true
  }
});

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', 
  credentials: true
}));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/reservations', reservationsRoutes);
app.use('/comments', commentsRoutes);
app.use('/messages', messagesRoutes);

app.set('io', io);
io.on('connection', (socket) => {
  socket.on('join', (room) => {
    socket.join(room);
  });
});

// סקריפט לבדיקת פיקדונות פגי תוקף כל 5 דקות
const checkExpiredDeposits = async () => {
  try {
    const expiredCount = await reservationService.checkExpiredDeposits();
    if (expiredCount > 0) {
      console.log(`✅ ${expiredCount} פיקדונות פגו תוקף ועודכנו אוטומטית`);
      // שליחת הודעה למנהלים
      io.to('admin').emit('depositsExpired', { count: expiredCount });
    }
  } catch (error) {
    console.error('❌ שגיאה בבדיקת פיקדונות פגי תוקף:', error);
  }
};

// הפעלת הבדיקה כל 5 דקות
setInterval(checkExpiredDeposits, 5 * 60 * 1000);

// הפעלת בדיקה ראשונית אחרי דקה
setTimeout(checkExpiredDeposits, 60 * 1000);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
