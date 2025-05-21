import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import userRoutes from './routes/userRoutes';
import reviewRoutes from './routes/reviewRoutes';
import barterRequestRoutes from './routes/barterRequestRoutes';
import notificationRoutes from './routes/notificationRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import profileRoutes from './routes/profile';
import marketplaceRoutes from './routes/marketplace';
import chatRoutes from './routes/chatRoutes';
import { initSocketService } from './services/socketService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tradetide';

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const socketService = initSocketService(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/profile', profileRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/chat', chatRoutes);
app.use(userRoutes);
app.use(reviewRoutes);
app.use(barterRequestRoutes);
app.use(notificationRoutes);
app.use(auditLogRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TradeTide backend is running!' });
});

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    
    // Start the server with error handling for port conflicts
    const startServer = (port: number) => {
      server.listen(port)
        .on('listening', () => {
          console.log(`Server running on port ${port}`);
          console.log(`WebSocket server initialized`);
        })
        .on('error', (err: NodeJS.ErrnoException) => {
          if (err.code === 'EADDRINUSE') {
            console.warn(`Port ${port} is already in use, trying ${port + 1}...`);
            startServer(port + 1);
          } else {
            console.error('Server error:', err);
            process.exit(1);
          }
        });
    };
    
    startServer(Number(PORT));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
}); 