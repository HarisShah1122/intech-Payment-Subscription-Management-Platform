import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const router = Router();

// Basic health check
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// Detailed health check
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const health = {
      success: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: 'disconnected',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
          external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100,
        },
        cpu: {
          usage: process.cpuUsage(),
        },
      },
    };

    // Check database connection
    if (mongoose.connection.readyState === 1) {
      health.services.database = 'connected';
    } else {
      health.services.database = 'disconnected';
      health.success = false;
    }

    const statusCode = health.success ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Database health check
router.get('/database', async (req: Request, res: Response) => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const health = {
      success: state === 1,
      state: states[state as keyof typeof states],
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
      timestamp: new Date().toISOString(),
    };

    // Test database with a simple ping
    if (state === 1) {
      await mongoose.connection.db.admin().ping();
      health.success = true;
    }

    const statusCode = health.success ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Database health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Database health check failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Memory usage check
router.get('/memory', (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  
  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100, // Resident Set Size
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100,
      arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024 * 100) / 100,
    },
    uptime: process.uptime(),
  });
});

// System information
router.get('/info', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid,
      uptime: process.uptime(),
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
    },
  });
});

export default router;
