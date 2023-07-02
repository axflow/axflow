import { config } from 'dotenv';

config();

export function getEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} environment variable not set`);
  }
  return value;
}
