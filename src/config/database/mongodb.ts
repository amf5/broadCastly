

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../../utils/logger.js';

dotenv.config();


export const mongoConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/live_stream',
  options: {
    dbName: process.env.MONGODB_DB_NAME || 'live_stream',
    maxPoolSize: 10,
    minPoolSize: 2,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: 'majority' as const,
  },
};


export const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(mongoConfig.uri, mongoConfig.options);
    console.log('✅ MongoDB connected successfully');
    logger.info('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB error:', err);
      logger.error('MongoDB error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
      logger.warn('MongoDB disconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    logger.error('MongoDB connection error:', error);
    throw error;
  }
};


export const disconnectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('Error disconnecting MongoDB:', error);
  }
};

export const healthCheckMongoDB = async (): Promise<{ 
  status: boolean; 
  details: any 
}> => {
  try {
    const startTime = Date.now();
  
    const connectionState = mongoose.connection.readyState;
    

    const stateMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      99: 'uninitialized',
    };
    
    const state = stateMap[connectionState] || 'unknown';
    const isConnected = connectionState === 1;
    
  
    if (!isConnected) {
      return {
        status: false,
        details: {
          state,
          message: 'MongoDB is not connected',
          timestamp: new Date().toISOString(),
        }
      };
    }

    const db = mongoose.connection.db;
    
    // 4.4 لو db غير موجود
    if (!db) {
      return {
        status: false,
        details: {
          state: 'connected',
          message: 'Database instance not available',
          timestamp: new Date().toISOString(),
        }
      };
    }

    let pingResult = null;
    let dbName = db.databaseName || 'unknown';
    
    try {
      pingResult = await db.admin().ping();
    } catch (pingError) {
      return {
        status: false,
        details: {
          state,
          error: (pingError as Error).message,
          message: 'Ping failed',
          timestamp: new Date().toISOString(),
        }
      };
    }

    const responseTime = Date.now() - startTime;
    
    const poolStats = {
      maxPoolSize: mongoConfig.options.maxPoolSize,
      minPoolSize: mongoConfig.options.minPoolSize,
      activeConnections: (mongoose.connection as any).connections?.length || 0,
    };
    
    return {
      status: true,
      details: {
        state,
        dbName,
        responseTime: `${responseTime}ms`,
        ping: pingResult,
        pool: poolStats,
        uri: process.env.MONGODB_URI ? 'configured' : 'not configured',
        timestamp: new Date().toISOString(),
      }
    };
    
  } catch (error) {

    return {
      status: false,
      details: {
        error: (error as Error).message,
        state: 'error',
        timestamp: new Date().toISOString(),
      }
    };
  }
};
export const isMongoDBConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};

export const getMongoDBInfo = async (): Promise<any> => {
  try {
    if (!isMongoDBConnected()) {
      return { error: 'Not connected' };
    }
    
    const db = mongoose.connection.db;

    if (!db) {
      return { error: 'Database not available' };
    }
    
    const collections = await db.listCollections().toArray();
    
    return {
      databaseName: db.databaseName || 'unknown',
      host: mongoose.connection.host || 'unknown',
      port: mongoose.connection.port || 27017,
      readyState: mongoose.connection.readyState,
      collections: collections.map((c: any) => c.name),
    };
  } catch (error) {
    return { error: (error as Error).message };
  }
};

export const mongoConnection = mongoose.connection;

export default {
  connectMongoDB,
  disconnectMongoDB,
  healthCheckMongoDB,
  isMongoDBConnected,
  getMongoDBInfo,
  mongoConnection,
  mongoConfig,
};