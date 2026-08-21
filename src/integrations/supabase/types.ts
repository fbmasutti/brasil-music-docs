export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      brand_kits: {
        Row: {
          created_at: string;
          id: string;
          logo_url: string | null;
          name: string;
          palette: Json;
          photo_url: string | null;
          preset: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name?: string;
          palette?: Json;
          photo_url?: string | null;
          preset?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name?: string;
          palette?: Json;
          photo_url?: string | null;
          preset?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      charges: {
        Row: {
          amount: number | null;
          client_id: string | null;
          created_at: string;
          description: string | null;
          due_date: string | null;
          event_id: string | null;
          id: string;
          paid_at: string | null;
          pix_payload: string | null;
          reference_month: string | null;
          status: string;
          student_id: string | null;
          txid: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount?: number | null;
          client_id?: string | null;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          event_id?: string | null;
          id?: string;
          paid_at?: string | null;
          pix_payload?: string | null;
          reference_month?: string | null;
          status?: string;
          student_id?: string | null;
          txid?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number | null;
          client_id?: string | null;
          created_at?: string;
          description?: string | null;
          due_date?: string | null;
          event_id?: string | null;
          id?: string;
          paid_at?: string | null;
          pix_payload?: string | null;
          reference_month?: string | null;
          status?: string;
          student_id?: string | null;
          txid?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "charges_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "charges_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          address: string | null;
          city: string | null;
          contact_name: string | null;
          created_at: string;
          doc: string | null;
          email: string | null;
          id: string;
          legal_name: string | null;
          name: string;
          notes: string | null;
          phone: string | null;
          state: string | null;
          user_id: string;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          contact_name?: string | null;
          created_at?: string;
          doc?: string | null;
          email?: string | null;
          id?: string;
          legal_name?: string | null;
          name: string;
          notes?: string | null;
          phone?: string | null;
          state?: string | null;
          user_id: string;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          contact_name?: string | null;
          created_at?: string;
          doc?: string | null;
          email?: string | null;
          id?: string;
          legal_name?: string | null;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          state?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      event_checklists: {
        Row: {
          created_at: string;
          done: boolean;
          due_date: string | null;
          event_id: string | null;
          id: string;
          label: string;
          phase: string;
          position: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          done?: boolean;
          due_date?: string | null;
          event_id?: string | null;
          id?: string;
          label: string;
          phase?: string;
          position?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          done?: boolean;
          due_date?: string | null;
          event_id?: string | null;
          id?: string;
          label?: string;
          phase?: string;
          position?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_checklists_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      event_expenses: {
        Row: {
          amount: number;
          category: string;
          created_at: string;
          event_id: string;
          id: string;
          notes: string | null;
          team_member_id: string | null;
          user_id: string;
        };
        Insert: {
          amount?: number;
          category?: string;
          created_at?: string;
          event_id: string;
          id?: string;
          notes?: string | null;
          team_member_id?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          category?: string;
          created_at?: string;
          event_id?: string;
          id?: string;
          notes?: string | null;
          team_member_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_expenses_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_expenses_team_member_id_fkey";
            columns: ["team_member_id"];
            isOneToOne: false;
            referencedRelation: "team_members";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          balance_due_date: string | null;
          city: string | null;
          client_id: string | null;
          created_at: string;
          deposit_due_date: string | null;
          ecad_sent: boolean;
          event_date: string | null;
          event_type: string;
          fee_deposit: number;
          fee_total: number;
          formation_id: string | null;
          full_address: string | null;
          google_calendar_event_id: string | null;
          id: string;
          notes: string | null;
          soundcheck_time: string | null;
          start_time: string | null;
          state: string | null;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
          venue: string | null;
        };
        Insert: {
          balance_due_date?: string | null;
          city?: string | null;
          client_id?: string | null;
          created_at?: string;
          deposit_due_date?: string | null;
          ecad_sent?: boolean;
          event_date?: string | null;
          event_type?: string;
          fee_deposit?: number;
          fee_total?: number;
          formation_id?: string | null;
          full_address?: string | null;
          google_calendar_event_id?: string | null;
          id?: string;
          notes?: string | null;
          soundcheck_time?: string | null;
          start_time?: string | null;
          state?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
          venue?: string | null;
        };
        Update: {
          balance_due_date?: string | null;
          city?: string | null;
          client_id?: string | null;
          created_at?: string;
          deposit_due_date?: string | null;
          ecad_sent?: boolean;
          event_date?: string | null;
          event_type?: string;
          fee_deposit?: number;
          fee_total?: number;
          formation_id?: string | null;
          full_address?: string | null;
          google_calendar_event_id?: string | null;
          id?: string;
          notes?: string | null;
          soundcheck_time?: string | null;
          start_time?: string | null;
          state?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
          venue?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_formation_id_fkey";
            columns: ["formation_id"];
            isOneToOne: false;
            referencedRelation: "formations";
            referencedColumns: ["id"];
          },
        ];
      };
      formation_members: {
        Row: {
          created_at: string;
          formation_id: string;
          id: string;
          split_percent: number;
          split_type: string;
          team_member_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          formation_id: string;
          id?: string;
          split_percent?: number;
          split_type?: string;
          team_member_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          formation_id?: string;
          id?: string;
          split_percent?: number;
          split_type?: string;
          team_member_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "formation_members_formation_id_fkey";
            columns: ["formation_id"];
            isOneToOne: false;
            referencedRelation: "formations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "formation_members_team_member_id_fkey";
            columns: ["team_member_id"];
            isOneToOne: false;
            referencedRelation: "team_members";
            referencedColumns: ["id"];
          },
        ];
      };
      formation_songs: {
        Row: {
          created_at: string;
          formation_id: string;
          id: string;
          position: number;
          song_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          formation_id: string;
          id?: string;
          position?: number;
          song_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          formation_id?: string;
          id?: string;
          position?: number;
          song_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "formation_songs_formation_id_fkey";
            columns: ["formation_id"];
            isOneToOne: false;
            referencedRelation: "formations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "formation_songs_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      formations: {
        Row: {
          base_fee: number;
          brand_kit_id: string | null;
          created_at: string;
          id: string;
          is_default: boolean;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          base_fee?: number;
          brand_kit_id?: string | null;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          base_fee?: number;
          brand_kit_id?: string | null;
          created_at?: string;
          id?: string;
          is_default?: boolean;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "formations_brand_kit_id_fkey";
            columns: ["brand_kit_id"];
            isOneToOne: false;
            referencedRelation: "brand_kits";
            referencedColumns: ["id"];
          },
        ];
      };
      gear_assets: {
        Row: {
          category: string | null;
          created_at: string;
          id: string;
          name: string;
          user_id: string;
          value: number;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          user_id: string;
          value?: number;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          user_id?: string;
          value?: number;
        };
        Relationships: [];
      };
      gear_checklist_items: {
        Row: {
          category: string;
          created_at: string;
          formation_id: string;
          id: string;
          label: string;
          position: number;
          user_id: string;
        };
        Insert: {
          category?: string;
          created_at?: string;
          formation_id: string;
          id?: string;
          label: string;
          position?: number;
          user_id: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          formation_id?: string;
          id?: string;
          label?: string;
          position?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gear_checklist_items_formation_id_fkey";
            columns: ["formation_id"];
            isOneToOne: false;
            referencedRelation: "formations";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: {
          created_at: string;
          doc: string | null;
          due_day: number;
          duration_min: number;
          email: string | null;
          guardian_name: string | null;
          guardian_phone: string | null;
          id: string;
          instrument: string | null;
          level: string | null;
          modality: string;
          monthly_fee: number;
          name: string;
          notes: string | null;
          phone: string | null;
          start_time: string | null;
          started_at: string | null;
          status: string;
          updated_at: string;
          user_id: string;
          weekday: number | null;
        };
        Insert: {
          created_at?: string;
          doc?: string | null;
          due_day?: number;
          duration_min?: number;
          email?: string | null;
          guardian_name?: string | null;
          guardian_phone?: string | null;
          id?: string;
          instrument?: string | null;
          level?: string | null;
          modality?: string;
          monthly_fee?: number;
          name: string;
          notes?: string | null;
          phone?: string | null;
          start_time?: string | null;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
          weekday?: number | null;
        };
        Update: {
          created_at?: string;
          doc?: string | null;
          due_day?: number;
          duration_min?: number;
          email?: string | null;
          guardian_name?: string | null;
          guardian_phone?: string | null;
          id?: string;
          instrument?: string | null;
          level?: string | null;
          modality?: string;
          monthly_fee?: number;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          start_time?: string | null;
          started_at?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          weekday?: number | null;
        };
        Relationships: [];
      };
      lesson_records: {
        Row: {
          created_at: string;
          id: string;
          lesson_date: string;
          notes: string | null;
          status: string;
          student_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          lesson_date: string;
          notes?: string | null;
          status?: string;
          student_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          lesson_date?: string;
          notes?: string | null;
          status?: string;
          student_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_records_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      generated_documents: {
        Row: {
          client_id: string | null;
          created_at: string;
          doc_type: string;
          event_id: string | null;
          file_url: string | null;
          id: string;
          payload: Json;
          signed_at: string | null;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string;
          doc_type: string;
          event_id?: string | null;
          file_url?: string | null;
          id?: string;
          payload?: Json;
          signed_at?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          client_id?: string | null;
          created_at?: string;
          doc_type?: string;
          event_id?: string | null;
          file_url?: string | null;
          id?: string;
          payload?: Json;
          signed_at?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "generated_documents_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "generated_documents_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      maintenance_fund_entries: {
        Row: {
          amount: number;
          created_at: string;
          event_id: string | null;
          id: string;
          reason: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          event_id?: string | null;
          id?: string;
          reason?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          event_id?: string | null;
          id?: string;
          reason?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "maintenance_fund_entries_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      portfolio_clippings: {
        Row: {
          category: string;
          created_at: string;
          description: string | null;
          event_name: string | null;
          happened_at: string | null;
          id: string;
          link_url: string | null;
          media_url: string | null;
          title: string;
          user_id: string;
          year: number | null;
        };
        Insert: {
          category?: string;
          created_at?: string;
          description?: string | null;
          event_name?: string | null;
          happened_at?: string | null;
          id?: string;
          link_url?: string | null;
          media_url?: string | null;
          title: string;
          user_id: string;
          year?: number | null;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string | null;
          event_name?: string | null;
          happened_at?: string | null;
          id?: string;
          link_url?: string | null;
          media_url?: string | null;
          title?: string;
          user_id?: string;
          year?: number | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          activities: string[];
          active_formation_id: string | null;
          address: string | null;
          bank_account: string | null;
          bank_agency: string | null;
          bank_name: string | null;
          cae_ipi: string | null;
          cep: string | null;
          city: string | null;
          cnae: string | null;
          cnd_expires_at: string | null;
          cpf_cnpj: string | null;
          created_at: string;
          default_issuer: string;
          doc_type: string | null;
          ecad_association: string | null;
          ecad_client_number: string | null;
          email: string | null;
          entity_type: string;
          google_calendar_email: string | null;
          google_calendar_refresh_token: string | null;
          id: string;
          inscricao_estadual: string | null;
          inscricao_municipal: string | null;
          legal_name: string | null;
          logo_url: string | null;
          maintenance_reserve_percent: number;
          onboarded: boolean;
          pf_address: string | null;
          pf_cep: string | null;
          pf_city: string | null;
          pf_cpf: string | null;
          pf_email: string | null;
          pf_full_name: string | null;
          pf_phone: string | null;
          pf_rg: string | null;
          pf_state: string | null;
          phone: string | null;
          pix_key: string | null;
          pj_address: string | null;
          pj_cep: string | null;
          pj_city: string | null;
          pj_cnpj: string | null;
          pj_email: string | null;
          pj_inscricao_estadual: string | null;
          pj_inscricao_municipal: string | null;
          pj_nome_fantasia: string | null;
          pj_phone: string | null;
          pj_razao_social: string | null;
          pj_state: string | null;
          stage_name: string;
          state: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          activities?: string[];
          active_formation_id?: string | null;
          address?: string | null;
          bank_account?: string | null;
          bank_agency?: string | null;
          bank_name?: string | null;
          cae_ipi?: string | null;
          cep?: string | null;
          city?: string | null;
          cnae?: string | null;
          cnd_expires_at?: string | null;
          cpf_cnpj?: string | null;
          created_at?: string;
          default_issuer?: string;
          doc_type?: string | null;
          ecad_association?: string | null;
          ecad_client_number?: string | null;
          email?: string | null;
          entity_type?: string;
          google_calendar_email?: string | null;
          google_calendar_refresh_token?: string | null;
          id?: string;
          inscricao_estadual?: string | null;
          inscricao_municipal?: string | null;
          legal_name?: string | null;
          logo_url?: string | null;
          maintenance_reserve_percent?: number;
          onboarded?: boolean;
          pf_address?: string | null;
          pf_cep?: string | null;
          pf_city?: string | null;
          pf_cpf?: string | null;
          pf_email?: string | null;
          pf_full_name?: string | null;
          pf_phone?: string | null;
          pf_rg?: string | null;
          pf_state?: string | null;
          phone?: string | null;
          pix_key?: string | null;
          pj_address?: string | null;
          pj_cep?: string | null;
          pj_city?: string | null;
          pj_cnpj?: string | null;
          pj_email?: string | null;
          pj_inscricao_estadual?: string | null;
          pj_inscricao_municipal?: string | null;
          pj_nome_fantasia?: string | null;
          pj_phone?: string | null;
          pj_razao_social?: string | null;
          pj_state?: string | null;
          stage_name?: string;
          state?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          activities?: string[];
          active_formation_id?: string | null;
          address?: string | null;
          bank_account?: string | null;
          bank_agency?: string | null;
          bank_name?: string | null;
          cae_ipi?: string | null;
          cep?: string | null;
          city?: string | null;
          cnae?: string | null;
          cnd_expires_at?: string | null;
          cpf_cnpj?: string | null;
          created_at?: string;
          default_issuer?: string;
          doc_type?: string | null;
          ecad_association?: string | null;
          ecad_client_number?: string | null;
          email?: string | null;
          entity_type?: string;
          google_calendar_email?: string | null;
          google_calendar_refresh_token?: string | null;
          id?: string;
          inscricao_estadual?: string | null;
          inscricao_municipal?: string | null;
          legal_name?: string | null;
          logo_url?: string | null;
          maintenance_reserve_percent?: number;
          onboarded?: boolean;
          pf_address?: string | null;
          pf_cep?: string | null;
          pf_city?: string | null;
          pf_cpf?: string | null;
          pf_email?: string | null;
          pf_full_name?: string | null;
          pf_phone?: string | null;
          pf_rg?: string | null;
          pf_state?: string | null;
          phone?: string | null;
          pix_key?: string | null;
          pj_address?: string | null;
          pj_cep?: string | null;
          pj_city?: string | null;
          pj_cnpj?: string | null;
          pj_email?: string | null;
          pj_inscricao_estadual?: string | null;
          pj_inscricao_municipal?: string | null;
          pj_nome_fantasia?: string | null;
          pj_phone?: string | null;
          pj_razao_social?: string | null;
          pj_state?: string | null;
          stage_name?: string;
          state?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_active_formation_id_fkey";
            columns: ["active_formation_id"];
            isOneToOne: false;
            referencedRelation: "formations";
            referencedColumns: ["id"];
          },
        ];
      };
      setlist_songs: {
        Row: {
          created_at: string;
          id: string;
          notes: string | null;
          position: number;
          setlist_id: string;
          song_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          position?: number;
          setlist_id: string;
          song_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          position?: number;
          setlist_id?: string;
          song_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "setlist_songs_setlist_id_fkey";
            columns: ["setlist_id"];
            isOneToOne: false;
            referencedRelation: "setlists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "setlist_songs_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      setlists: {
        Row: {
          created_at: string;
          event_id: string | null;
          id: string;
          name: string;
          notes: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_id?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "setlists_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      song_writers: {
        Row: {
          association: string | null;
          cae_ipi: string | null;
          created_at: string;
          id: string;
          name: string;
          role: string | null;
          share_percent: number;
          song_id: string;
          user_id: string;
        };
        Insert: {
          association?: string | null;
          cae_ipi?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          role?: string | null;
          share_percent?: number;
          song_id: string;
          user_id: string;
        };
        Update: {
          association?: string | null;
          cae_ipi?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          role?: string | null;
          share_percent?: number;
          song_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "song_writers_song_id_fkey";
            columns: ["song_id"];
            isOneToOne: false;
            referencedRelation: "songs";
            referencedColumns: ["id"];
          },
        ];
      };
      songs: {
        Row: {
          created_at: string;
          duration_seconds: number;
          external_link: string | null;
          genre: string | null;
          id: string;
          isrc: string | null;
          iswc: string | null;
          notes: string | null;
          origin: string;
          original_authors: string | null;
          performers: string | null;
          producer: string | null;
          publisher: string | null;
          studio: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          duration_seconds?: number;
          external_link?: string | null;
          genre?: string | null;
          id?: string;
          isrc?: string | null;
          iswc?: string | null;
          notes?: string | null;
          origin?: string;
          original_authors?: string | null;
          performers?: string | null;
          producer?: string | null;
          publisher?: string | null;
          studio?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          duration_seconds?: number;
          external_link?: string | null;
          genre?: string | null;
          id?: string;
          isrc?: string | null;
          iswc?: string | null;
          notes?: string | null;
          origin?: string;
          original_authors?: string | null;
          performers?: string | null;
          producer?: string | null;
          publisher?: string | null;
          studio?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          cpf: string | null;
          created_at: string;
          email: string | null;
          food_restrictions: string | null;
          id: string;
          instrument: string | null;
          name: string;
          notes: string | null;
          phone: string | null;
          pis_pasep: string | null;
          pix_key: string | null;
          rg: string | null;
          role: string | null;
          user_id: string;
        };
        Insert: {
          cpf?: string | null;
          created_at?: string;
          email?: string | null;
          food_restrictions?: string | null;
          id?: string;
          instrument?: string | null;
          name: string;
          notes?: string | null;
          phone?: string | null;
          pis_pasep?: string | null;
          pix_key?: string | null;
          rg?: string | null;
          role?: string | null;
          user_id: string;
        };
        Update: {
          cpf?: string | null;
          created_at?: string;
          email?: string | null;
          food_restrictions?: string | null;
          id?: string;
          instrument?: string | null;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          pis_pasep?: string | null;
          pix_key?: string | null;
          rg?: string | null;
          role?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      technical_riders: {
        Row: {
          backline: string | null;
          channel_list: Json;
          console_specs: string | null;
          created_at: string;
          event_id: string | null;
          formation_id: string | null;
          hospitality: string | null;
          id: string;
          lighting_requirements: string | null;
          monitor_specs: string | null;
          name: string;
          pa_specs: string | null;
          rooming_list: string | null;
          sound_requirements: string | null;
          stage_plot: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          backline?: string | null;
          channel_list?: Json;
          console_specs?: string | null;
          created_at?: string;
          event_id?: string | null;
          formation_id?: string | null;
          hospitality?: string | null;
          id?: string;
          lighting_requirements?: string | null;
          monitor_specs?: string | null;
          name?: string;
          pa_specs?: string | null;
          rooming_list?: string | null;
          sound_requirements?: string | null;
          stage_plot?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          backline?: string | null;
          channel_list?: Json;
          console_specs?: string | null;
          created_at?: string;
          event_id?: string | null;
          formation_id?: string | null;
          hospitality?: string | null;
          id?: string;
          lighting_requirements?: string | null;
          monitor_specs?: string | null;
          name?: string;
          pa_specs?: string | null;
          rooming_list?: string | null;
          sound_requirements?: string | null;
          stage_plot?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "technical_riders_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "technical_riders_formation_id_fkey";
            columns: ["formation_id"];
            isOneToOne: false;
            referencedRelation: "formations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
