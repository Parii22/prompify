-- ============================================================
-- Prompify
-- Phase 5 & Multi-LLM Provider Migration
-- Table: prompt_runs
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create table prompt_runs
CREATE TABLE IF NOT EXISTS public.prompt_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_prompt TEXT NOT NULL,
  objective TEXT,
  analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  refined_versions JSONB NOT NULL DEFAULT '{}'::jsonb,
  selected_variant TEXT NOT NULL,
  selected_refined_prompt TEXT NOT NULL,
  original_response TEXT NOT NULL,
  refined_response TEXT NOT NULL,
  evaluation JSONB NOT NULL DEFAULT '{}'::jsonb,
  model TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'gemini',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Performance indexes
-- Primary sort index for history queries (newest runs first)
CREATE INDEX IF NOT EXISTS idx_prompt_runs_created_at 
  ON public.prompt_runs (created_at DESC);

-- Secondary index for filtering by prompt variant (balanced, detailed, concise)
CREATE INDEX IF NOT EXISTS idx_prompt_runs_selected_variant 
  ON public.prompt_runs (selected_variant);

-- Index for querying runs by LLM provider (gemini, groq)
CREATE INDEX IF NOT EXISTS idx_prompt_runs_provider 
  ON public.prompt_runs (provider);

-- 3. Row Level Security (RLS)
ALTER TABLE public.prompt_runs ENABLE ROW LEVEL SECURITY;

-- 4. Multi-Provider Fallback Migration (Safe for existing tables)
ALTER TABLE public.prompt_runs 
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'gemini';
