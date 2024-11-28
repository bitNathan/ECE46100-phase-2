import dotenv from 'dotenv';
import G from 'glob';

dotenv.config({ path: '../../.env' });
interface Config 
{
    GITHUB_TOKEN: string;
    LOG_LEVEL: number;
    LOG_FILE: string;
}
// Create a constant to be used globally, simple config object can be easily accessable across all other scripts

const config: Config = {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
    LOG_LEVEL: Number(process.env.LOG_LEVEL) || 0,
    LOG_FILE: process.env.LOG_FILE || ''
}

export default config;