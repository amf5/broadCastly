import { Kafka, Producer, Admin } from 'kafkajs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger.js';

dotenv.config();

const caPath = path.resolve(process.cwd(), 'certs', 'ca.pem');

if (!fs.existsSync(caPath)) {
  throw new Error(`CA certificate not found at: ${caPath}`);
}

export const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'live-stream-app',
  brokers: (process.env.KAFKA_BROKERS || '').split(','),
  ssl: {
    rejectUnauthorized: true,
    ca: [fs.readFileSync(caPath, 'utf-8')],
  },
  sasl: {
    mechanism: 'scram-sha-256',
    username: process.env.KAFKA_SASL_USERNAME || '',
    password: process.env.KAFKA_SASL_PASSWORD || '',
  },
  retry: {
    initialRetryTime: 300,
    retries: 8,
  },
  logLevel: 1,
});

export const producer: Producer = kafka.producer({
  allowAutoTopicCreation: true,
  idempotent: true,
  maxInFlightRequests: 1,
});

export const admin: Admin = kafka.admin();

export const connectKafka = async (): Promise<void> => {
  try {
    if (!process.env.KAFKA_SASL_PASSWORD) {
      throw new Error('KAFKA_SASL_PASSWORD is not set in .env');
    }

    await producer.connect();
    await admin.connect();
    console.log('✅ Kafka Producer connected to Aiven');
    logger.info('Kafka connected successfully');
  } catch (error) {
    console.error('❌ Kafka connection error:', (error as Error).message);
    logger.error('Kafka connection error:', error);
    throw error;
  }
};

export const disconnectKafka = async (): Promise<void> => {
  try {
    await producer.disconnect();
    await admin.disconnect();
    console.log('✅ Kafka disconnected');
  } catch (error) {
    logger.error('Error disconnecting Kafka:', error);
  }
};

export const publishEvent = async (
  topic: string,
  event: any
): Promise<void> => {
  try {
    await producer.send({
      topic,
      messages: [
        {
          key: event.type || String(Date.now()),
          value: JSON.stringify(event),
        },
      ],
    });
    logger.debug(`Event published to ${topic}:`, event.type);
  } catch (error) {
    logger.error(`Error publishing event to ${topic}:`, error);
    throw error;
  }
};