import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

export const envConfig = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // Google Gemini API configuration (Primary Provider)
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  },

  // Groq API configuration (Secondary / Fallback Provider)
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  },

  // Supabase Database configuration
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // Optional Development Provider Override ('groq' | 'gemini')
  forceLlmProvider: process.env.FORCE_LLM_PROVIDER?.trim().toLowerCase() || null,
};
