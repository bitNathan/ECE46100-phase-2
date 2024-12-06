import dotenv from 'dotenv';

dotenv.config();

interface Config 
{
    GITHUB_TOKEN: string;
    LOG_LEVEL: number;
    LOG_FILE: string;
}

// Create a constant to be used globally, simple config object can be easily accessible across all other scripts
const config: Config = {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN as string,
    LOG_LEVEL: Number(process.env.LOG_LEVEL),
    LOG_FILE: process.env.LOG_FILE as string
}

if (!config.GITHUB_TOKEN || !config.LOG_LEVEL || !config.LOG_FILE) {
    throw new Error("Missing required environment variables");
}

export default config;