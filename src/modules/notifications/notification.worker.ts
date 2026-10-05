import { Worker } from 'bullmq';

const worker = new Worker(
  'notifications',
  async (job) => {
    console.log(
      'Processing:',
      job.name,
      job.data,
    );

    if (job.name === 'incident-created') {
      console.log(
        `Notify incident ${job.data.incidentId}`,
      );
    }
  },
  {
    connection: {
      host: 'localhost',
      port: 6379,
    },
  },
);
