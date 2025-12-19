export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          timezone: string
          date_format: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          timezone?: string
          date_format?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          timezone?: string
          date_format?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          company_id: string
          name: string
          email: string
          phone: string | null
          role: 'admin' | 'member'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_id: string
          name: string
          email: string
          phone?: string | null
          role?: 'admin' | 'member'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          email?: string
          phone?: string | null
          role?: 'admin' | 'member'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          company_id: string
          name: string
          mobile: string
          email: string
          budget: string | null
          possession_timeline: string | null
          unit_preference: string | null
          location_preference: string | null
          source: string
          status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
          next_follow_up: string | null
          notes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          mobile: string
          email: string
          budget?: string | null
          possession_timeline?: string | null
          unit_preference?: string | null
          location_preference?: string | null
          source?: string
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
          next_follow_up?: string | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          mobile?: string
          email?: string
          budget?: string | null
          possession_timeline?: string | null
          unit_preference?: string | null
          location_preference?: string | null
          source?: string
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
          next_follow_up?: string | null
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      calls: {
        Row: {
          id: string
          lead_id: string
          company_id: string
          agent_id: string | null
          vapi_call_id: string | null
          status: 'connected' | 'failed' | 'no_answer' | 'busy'
          duration: number
          recording_url: string | null
          transcript: string | null
          summary: string | null
          intent: 'high' | 'medium' | 'low' | null
          sentiment: 'positive' | 'neutral' | 'negative' | null
          success_evaluation: boolean
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          company_id: string
          agent_id?: string | null
          vapi_call_id?: string | null
          status?: 'connected' | 'failed' | 'no_answer' | 'busy'
          duration?: number
          recording_url?: string | null
          transcript?: string | null
          summary?: string | null
          intent?: 'high' | 'medium' | 'low' | null
          sentiment?: 'positive' | 'neutral' | 'negative' | null
          success_evaluation?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          company_id?: string
          agent_id?: string | null
          vapi_call_id?: string | null
          status?: 'connected' | 'failed' | 'no_answer' | 'busy'
          duration?: number
          recording_url?: string | null
          transcript?: string | null
          summary?: string | null
          intent?: 'high' | 'medium' | 'low' | null
          sentiment?: 'positive' | 'neutral' | 'negative' | null
          success_evaluation?: boolean
          created_at?: string
        }
      }
      agents: {
        Row: {
          id: string
          company_id: string
          name: string
          voice: string
          greeting: string
          tone: string
          business_context: string
          business_hours_from: string
          business_hours_to: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          name: string
          voice: string
          greeting: string
          tone?: string
          business_context: string
          business_hours_from?: string
          business_hours_to?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          name?: string
          voice?: string
          greeting?: string
          tone?: string
          business_context?: string
          business_hours_from?: string
          business_hours_to?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
