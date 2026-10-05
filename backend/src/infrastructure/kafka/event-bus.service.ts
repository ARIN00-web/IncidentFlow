import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class EventBusService implements OnModuleDestroy {
  private readonly logger = new Logger(EventBusService.name);
  private producer?: Producer;
  private connecting?: Promise<void>;

  private get enabled() {
    return process.env.KAFKA_ENABLED === 'true';
  }

  private async ensureProducer() {
    if (!this.enabled) return;

    if (this.producer) return;
    if (this.connecting) return this.connecting;

    const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9092')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

    const kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID ?? 'incidentflow',
      brokers,
      connectionTimeout: 3000,
      requestTimeout: 5000,
    });

    this.producer = kafka.producer();

    this.connecting = this.producer.connect()
      .then(() => undefined)
      .catch((error) => {
        this.producer = undefined;
        throw error;
      })
      .finally(() => {
        this.connecting = undefined;
      });

    return this.connecting;
  }

  async publish(topic: string, key: string, event: unknown) {
    if (!this.enabled) {
      this.logger.debug(`Kafka disabled; event ${topic}/${key} not published`);
      return;
    }

    try {
      await this.ensureProducer();
      await this.producer!.send({
        topic,
        messages: [{
          key,
          value: JSON.stringify(event),
        }],
      });
    } catch (error) {
      this.logger.error(`Kafka publish failed for ${topic}`, error);
      // Do not make a successful DB-backed API request fail only because
      // optional Kafka infrastructure is unavailable.
    }
  }

  async onModuleDestroy() {
    if (this.producer) {
      await this.producer.disconnect().catch(() => undefined);
    }
  }
}