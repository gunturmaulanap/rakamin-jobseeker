-- ================================================================
-- 🚀 RECRUITMENT SYSTEM SETUP
-- ================================================================

-- Drop tables if exists
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ================================================================
-- 👥 USERS TABLE
-- ================================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name TEXT,
    role VARCHAR(20) DEFAULT 'candidate' CHECK (role IN ('candidate', 'admin')),
    email_confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 💼 JOBS TABLE
-- ================================================================
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    department TEXT NOT NULL,
    salary_min INTEGER,
    salary_max INTEGER,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('active', 'inactive', 'draft')),
    candidates INTEGER DEFAULT 1,
    required_fields JSONB DEFAULT '{
        "full_name": true,
        "email": true,
        "phone": false,
        "gender": false,
        "linkedin": false,
        "domicile": false,
        "resume": false,
        "portfolio": false,
        "photo": false
    }'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    admin_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 📊 APPLICATIONS TABLE
-- ================================================================
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    gender VARCHAR(10),
    linkedin VARCHAR(255),
    domicile VARCHAR(255),
    photo_url TEXT,
    date_of_birth DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 🔐 PERMISSIONS
-- ================================================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.jobs TO authenticated;
GRANT ALL ON public.applications TO authenticated;

GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT ON public.applications TO anon;

-- ================================================================
-- 👤 DEFAULT ADMIN
-- ================================================================
-- STEP BUAT ADMIN

-- 1. Masuk ke authenticated
-- 2. Create users
-- 3. Buat dengan email admin@rakamin.com, passwordnya password123 atau bebas
-- 4. masuk ke tabel editors
-- 5. Tambahkan admin@rakamin.com ke role admin dan sesuaikan uuidnya dengan yang sudah dibuat di users yang berada di authenticated