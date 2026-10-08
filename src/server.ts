import { createServer } from 'http';
import dotenv from 'dotenv';

import app from './app.js';
import { connectKafka, disconnectKafka } from './config/kafka/kafka.js';
import { connectMySQL, disconnectMySQL } from './config/database/mysql.js';
import { connectMongoDB, disconnectMongoDB } from './config/database/mongodb.js';
import { connectRedis, disconnectRedis } from './config/Redis/redis.js';
import { createTopics } from './config/kafka/topic.js';
import { createWebSocketServer } from './websocket/index.js';
import { createUsersTable } from './models/User.js';
import { createStreamsTable } from './models/Stream.js';
import { createDonationsTable } from './models/Donation.js';
import { createTokensTable } from './models/Token.js';
import { startCommentConsumer } from './events/consumers/commentConsumer.js';
import { startDonationConsumer } from './events/consumers/donationConsumer.js';
import { startRTMPServer } from './services/rtmpService.js';
import { logger } from './utils/logger.js';
import { startStreamConsumer } from './events/consumers/streamConsumer.js';
import { startNotificationConsumer } from './events/consumers/notificationConsumer.js';

dotenv.config();

const server = createServer(app);

let kafkaConnected = false;
let wss: any = null;

export const startServer = async (): Promise<void> => {
  try {
    console.log('\n🚀 Starting server...');
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info('Starting server...');

    // ============================================================
    // 1. MySQL
    // ============================================================
    console.log('\n📊 Connecting to MySQL...');
    await connectMySQL();
    console.log('✅ MySQL connected');

    // ============================================================
    // 2. MongoDB
    // ============================================================
    console.log('\n📊 Connecting to MongoDB...');
    await connectMongoDB();
    console.log('✅ MongoDB connected');

    // ============================================================
    // 3. Create Tables
    // ============================================================
    console.log('\n📋 Creating tables...');
    await createUsersTable();
    await createStreamsTable();
    await createDonationsTable();
    await createTokensTable();
    console.log('✅ All tables ready');

    // ============================================================
    // 4. Redis
    // ============================================================
    console.log('\n📊 Redis...');
    await connectRedis();
    console.log('✅ Redis connected');

    // ============================================================
    // 5. Kafka (Non-Critical)
    // ============================================================
    console.log('\n📊 Connecting to Kafka...');
    try {
      await connectKafka();
      await createTopics();
      kafkaConnected = true;
      console.log('✅ Kafka connected');
      console.log('✅ Topics created');

      // Start Kafka Consumers
      await startCommentConsumer();
      await startDonationConsumer();
      await startStreamConsumer();
      await startNotificationConsumer();
      console.log('✅ Kafka Consumers started');
    } catch (kafkaError) {
      kafkaConnected = false;
      console.warn('⚠️ Kafka connection failed — server will continue without Kafka');
      console.warn('⚠️ Reason:', (kafkaError as Error).message);
      logger.warn('Kafka connection failed — continuing without Kafka', {
        error: (kafkaError as Error).message,
      });
    }

    // ============================================================
    // 6. WebSocket
    // ============================================================
    try {
      wss = createWebSocketServer(server);
      console.log('✅ WebSocket ready');
    } catch (error: any) {
      console.error('❌ Failed to start WebSocket:', error);
      logger.error('Failed to start WebSocket:', error);
      process.exit(1);
    }

    // ============================================================
    // 7. RTMP Server
    // ============================================================
    try {
      startRTMPServer();
      console.log('✅ RTMP Server ready');
    } catch (error: any) {
      console.warn('⚠️ RTMP Server failed:', error.message);
      logger.warn('RTMP Server failed:', error);
    }

    // ============================================================
    // 8. Start HTTP Server
    // ============================================================
    const PORT = parseInt(process.env.PORT || '3000');
    server.listen(PORT, () => {
      console.log(`\n✅ ========================================`);
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
      console.log(`📺 RTMP: rtmp://localhost:1935/live`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health Check: http://localhost:${PORT}/health`);
      console.log(`📊 Kafka: ${kafkaConnected ? '✅ connected' : '⚠️ not connected'}`);
      console.log(`✅ ========================================\n`);
      logger.info(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error('\n❌ Failed to start server:', error);
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

export const closeServer = async (): Promise<void> => {
  console.log('\n🛑 Closing server...');

  server.close(async () => {
    console.log('🔌 HTTP server closed');

    try {
      await disconnectMySQL();
      await disconnectMongoDB();
      await disconnectRedis();

      if (kafkaConnected) {
        await disconnectKafka();
      }

      console.log('✅ All connections closed');
      logger.info('Server closed successfully');
    } catch (error) {
      console.error('❌ Error closing connections:', error);
    }
  });
};

startServer();

export const isKafkaConnected = (): boolean => kafkaConnected;

export { app, server, wss };
export default { app, server, startServer, closeServer, isKafkaConnected };