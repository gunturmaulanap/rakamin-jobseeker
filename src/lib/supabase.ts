import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false // Disable to prevent auth loops
  }
})

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          gender: string | null
          linkedin: string | null
          domicile: string | null
          role: 'admin' | 'candidate'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          phone?: string | null
          gender?: string | null
          linkedin?: string | null
          domicile?: string | null
          role: 'admin' | 'candidate'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          gender?: string | null
          linkedin?: string | null
          domicile?: string | null
          role?: 'admin' | 'candidate'
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          title: string
          description: string
          department: string
          salary_min: number | null
          salary_max: number | null
          status: 'active' | 'inactive' | 'draft'
          required_fields: {
            full_name: 'mandatory' | 'optional' | 'off'
            email: 'mandatory' | 'optional' | 'off'
            phone: 'mandatory' | 'optional' | 'off'
            gender: 'mandatory' | 'optional' | 'off'
            linkedin: 'mandatory' | 'optional' | 'off'
            domicile: 'mandatory' | 'optional' | 'off'
            resume: 'mandatory' | 'optional' | 'off'
            portfolio: 'mandatory' | 'optional' | 'off'
            photo: 'mandatory' | 'optional' | 'off'
            date_of_birth: 'mandatory' | 'optional' | 'off'
          }
          admin_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          department: string
          salary_min?: number | null
          salary_max?: number | null
          status?: 'active' | 'inactive' | 'draft'
          required_fields: {
            full_name: 'mandatory' | 'optional' | 'off'
            email: 'mandatory' | 'optional' | 'off'
            phone: 'mandatory' | 'optional' | 'off'
            gender: 'mandatory' | 'optional' | 'off'
            linkedin: 'mandatory' | 'optional' | 'off'
            domicile: 'mandatory' | 'optional' | 'off'
            resume: 'mandatory' | 'optional' | 'off'
            portfolio: 'mandatory' | 'optional' | 'off'
            photo: 'mandatory' | 'optional' | 'off'
            date_of_birth: 'mandatory' | 'optional' | 'off'
          }
          admin_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          department?: string
          salary_min?: number | null
          salary_max?: number | null
          status?: 'active' | 'inactive' | 'draft'
          required_fields?: {
            full_name: boolean
            email: boolean
            phone: boolean
            gender: boolean
            linkedin: boolean
            domicile: boolean
            resume: boolean
            portfolio: boolean
            photo: boolean
          }
          admin_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          job_id: string
          candidate_id: string
          full_name: string | null
          email: string | null
          phone: string | null
          gender: string | null
          linkedin: string | null
          domicile: string | null
          resume_url: string | null
          portfolio_url: string | null
          photo_url: string | null
          status: 'pending' | 'reviewing' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          candidate_id: string
          full_name?: string | null
          email?: string | null
          phone?: string | null
          gender?: string | null
          linkedin?: string | null
          domicile?: string | null
          resume_url?: string | null
          portfolio_url?: string | null
          photo_url?: string | null
          status?: 'pending' | 'reviewing' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          candidate_id?: string
          full_name?: string | null
          email?: string | null
          phone?: string | null
          gender?: string | null
          linkedin?: string | null
          domicile?: string | null
          resume_url?: string | null
          portfolio_url?: string | null
          photo_url?: string | null
          status?: 'pending' | 'reviewing' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}