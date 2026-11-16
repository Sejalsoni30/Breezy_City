-- PostgreSQL / Supabase Schema for Urban Air Quality Assistant
-- Run this in the Supabase SQL Editor if connecting a remote database.

CREATE TABLE IF NOT EXISTS public.user_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    latitude NUMERIC(6, 3) NOT NULL,
    longitude NUMERIC(6, 3) NOT NULL,
    display_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user ON public.user_bookmarks(user_id);

CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    query TEXT NOT NULL,
    searched_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON public.search_history(user_id);
