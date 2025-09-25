const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models and initialize database
const db = require('./src/models');

// Import routes
const authRoutes = require('./src/routes/auth');
const farmerRoutes = require('./src/routes/farmerRoutes');
const cropRoutes = require('./src/routes/cropRoutes');
const marketplaceRoutes = require('./src/routes/marketplaceRoutes');

// Import seeders
const seedCropTemplates = require('./seeders/cropTemplates');

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'GreenTrust API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/marketplace', marketplaceRoutes);

// Add these route imports
const buyerRoutes = require('./src/routes/buyerRoutes');
const inquiryRoutes = require('./src/routes/inquiryRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

// Add these route handlers
app.use('/api/buyer', buyerRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Error handler
const errorHandler = require('./src/middleware/errorHandler');
app.use(errorHandler);

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const http = require('http');
const { initSocket } = require('./src/socket');
const { initCache } = require('./src/cache');

// Start server
const PORT = process.env.PORT || 3000;

let server;

async function startServer() {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync database models
    await db.sequelize.sync({ force: process.env.NODE_ENV === 'test' });
    console.log('✅ Database synced');
    
    if (process.env.NODE_ENV !== 'test') {
      // Seed crop templates
      await seedCropTemplates();
    }

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Initialize Socket.IO
    initSocket(httpServer);

    // Initialize Redis
    if (process.env.NODE_ENV !== 'test') {
      await initCache();
    }

    // Start server
    server = httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📋 Health: http://localhost:${PORT}/health`);
    });

    return server;

  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, db };
