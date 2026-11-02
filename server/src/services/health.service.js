import { envConfig } from '../config/env.config.js';

export const getHealthData = () => {
  return {
    status: 'healthy',
    service: 'Prompify Backend',
    uptimeSeconds: Math.floor(process.uptime()),
    environment: envConfig.nodeEnv,
    timestamp: new Date().toISOString(),
  };
};
