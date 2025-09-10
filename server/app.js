require('dotenv').config();
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
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'https://meymad-pool.netlify.app',
      'https://meymad-pool-client.netlify.app',
      'https://meymad-pool.onrender.com',
      process.env.CLIENT_URL
    ].filter(Boolean),
    credentials: true
  }
});

app.use(express.json());
app.use(cookieParser());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'https://meymad-pool.netlify.app',
      'https://meymad-pool-client.netlify.app',
      'https://meymad-pool.onrender.com',
      process.env.CLIENT_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
};

app.use(cors(corsOptions));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Meymad Pool Server is running!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

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
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database host: ${process.env.DB_HOST || 'not set'}`);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
