export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "admin";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled"
  | "suspended";
export type ContentCategory = "doencas" | "transtornos" | "curiosidades";
export type ContentStatus = "draft" | "published" | "archived";
export type ContentAccess = "free" | "subscriber";
export type ContentType = "lesson" | "ebook" | "quiz" | "story" | "blog";
export type NotificationTarget = "all" | "subscribers" | "free";
export type PaymentProvider = "mercado_pago";
export type EmailJobStatus =
  | "pending"
  | "processing"
  | "sent"
  | "failed"
  | "cancelled";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string | null;
          status: SubscriptionStatus;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          provider: string | null;
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          external_reference: string | null;
          provider_plan_id: string | null;
          provider_status: string | null;
          provider_payment_method: string | null;
          provider_payer_email: string | null;
          provider_checkout_url: string | null;
          last_payment_id: string | null;
          last_payment_status: string | null;
          last_event_at: string | null;
          cancelled_at: string | null;
          paused_at: string | null;
          cancellation_reason: string | null;
          metadata: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id?: string | null;
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          provider?: string | null;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          external_reference?: string | null;
          provider_plan_id?: string | null;
          provider_status?: string | null;
          provider_payment_method?: string | null;
          provider_payer_email?: string | null;
          provider_checkout_url?: string | null;
          last_payment_id?: string | null;
          last_payment_status?: string | null;
          last_event_at?: string | null;
          cancelled_at?: string | null;
          paused_at?: string | null;
          cancellation_reason?: string | null;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          plan_id?: string | null;
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          provider?: string | null;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          external_reference?: string | null;
          provider_plan_id?: string | null;
          provider_status?: string | null;
          provider_payment_method?: string | null;
          provider_payer_email?: string | null;
          provider_checkout_url?: string | null;
          last_payment_id?: string | null;
          last_payment_status?: string | null;
          last_event_at?: string | null;
          cancelled_at?: string | null;
          paused_at?: string | null;
          cancellation_reason?: string | null;
          metadata?: Json;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      content_items: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          body: string | null;
          type: ContentType;
          category: ContentCategory;
          status: ContentStatus;
          access: ContentAccess;
          thumbnail_path: string | null;
          thumbnail_url: string | null;
          video_path: string | null;
          video_url: string | null;
          duration_seconds: number;
          published_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string;
          body?: string | null;
          type: ContentType;
          category: ContentCategory;
          status?: ContentStatus;
          access?: ContentAccess;
          thumbnail_path?: string | null;
          thumbnail_url?: string | null;
          video_path?: string | null;
          video_url?: string | null;
          duration_seconds?: number;
          published_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          description?: string;
          body?: string | null;
          type?: ContentType;
          category?: ContentCategory;
          status?: ContentStatus;
          access?: ContentAccess;
          thumbnail_path?: string | null;
          thumbnail_url?: string | null;
          video_path?: string | null;
          video_url?: string | null;
          duration_seconds?: number;
          published_at?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_items_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      content_tags: {
        Row: {
          id: string;
          content_id: string;
          tag: string;
        };
        Insert: {
          id?: string;
          content_id: string;
          tag: string;
        };
        Update: {
          content_id?: string;
          tag?: string;
        };
        Relationships: [
          {
            foreignKeyName: "content_tags_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
        ];
      };
      content_materials: {
        Row: {
          id: string;
          content_id: string;
          title: string;
          type: string;
          storage_path: string | null;
          external_url: string | null;
          pages: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_id: string;
          title: string;
          type?: string;
          storage_path?: string | null;
          external_url?: string | null;
          pages?: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          content_id?: string;
          title?: string;
          type?: string;
          storage_path?: string | null;
          external_url?: string | null;
          pages?: number;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "content_materials_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
        ];
      };
      quizzes: {
        Row: {
          id: string;
          content_id: string | null;
          slug: string;
          title: string;
          description: string;
          category: ContentCategory;
          status: ContentStatus;
          access: ContentAccess;
          difficulty: string;
          estimated_minutes: number;
          thumbnail_path: string | null;
          created_by: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content_id?: string | null;
          slug: string;
          title: string;
          description?: string;
          category: ContentCategory;
          status?: ContentStatus;
          access?: ContentAccess;
          difficulty?: string;
          estimated_minutes?: number;
          thumbnail_path?: string | null;
          created_by?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content_id?: string | null;
          slug?: string;
          title?: string;
          description?: string;
          category?: ContentCategory;
          status?: ContentStatus;
          access?: ContentAccess;
          difficulty?: string;
          estimated_minutes?: number;
          thumbnail_path?: string | null;
          created_by?: string | null;
          published_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quizzes_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quizzes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_questions: {
        Row: {
          id: string;
          quiz_id: string;
          question: string;
          explanation: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question: string;
          explanation?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          quiz_id?: string;
          question?: string;
          explanation?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_options: {
        Row: {
          id: string;
          question_id: string;
          text: string;
          is_correct: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          text: string;
          is_correct?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          question_id?: string;
          text?: string;
          is_correct?: boolean;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "quiz_questions";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string;
          score: number;
          answers: Json;
          elapsed_seconds: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          user_id: string;
          score?: number;
          answers?: Json;
          elapsed_seconds?: number;
          created_at?: string;
        };
        Update: {
          quiz_id?: string;
          user_id?: string;
          score?: number;
          answers?: Json;
          elapsed_seconds?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_progress: {
        Row: {
          user_id: string;
          content_id: string;
          progress_seconds: number;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          content_id: string;
          progress_seconds?: number;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          progress_seconds?: number;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_progress_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_content: {
        Row: {
          user_id: string;
          content_id: string;
          saved_at: string;
        };
        Insert: {
          user_id: string;
          content_id: string;
          saved_at?: string;
        };
        Update: {
          saved_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_content_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
        ];
      };
      user_ebook_downloads: {
        Row: {
          user_id: string;
          content_id: string;
          downloaded_at: string;
        };
        Insert: {
          user_id: string;
          content_id: string;
          downloaded_at?: string;
        };
        Update: {
          downloaded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_ebook_downloads_content_id_fkey";
            columns: ["content_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          message: string;
          target: NotificationTarget;
          kind: string;
          cta_url: string | null;
          dedupe_key: string | null;
          metadata: Json;
          sent_to_count: number;
          sent_at: string | null;
          expires_at: string | null;
          audience_created_before: string | null;
          archived_at: string | null;
          archived_by: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          message: string;
          target?: NotificationTarget;
          kind?: string;
          cta_url?: string | null;
          dedupe_key?: string | null;
          metadata?: Json;
          sent_to_count?: number;
          sent_at?: string | null;
          expires_at?: string | null;
          audience_created_before?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string | null;
          title?: string;
          message?: string;
          target?: NotificationTarget;
          kind?: string;
          cta_url?: string | null;
          dedupe_key?: string | null;
          metadata?: Json;
          sent_to_count?: number;
          sent_at?: string | null;
          expires_at?: string | null;
          audience_created_before?: string | null;
          archived_at?: string | null;
          archived_by?: string | null;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_reads: {
        Row: {
          notification_id: string;
          user_id: string;
          read_at: string;
        };
        Insert: {
          notification_id: string;
          user_id: string;
          read_at?: string;
        };
        Update: {
          read_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey";
            columns: ["notification_id"];
            isOneToOne: false;
            referencedRelation: "notifications";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_transactions: {
        Row: {
          id: string;
          subscription_id: string;
          user_id: string;
          provider: PaymentProvider;
          provider_payment_id: string | null;
          provider_authorized_payment_id: string | null;
          external_reference: string | null;
          description: string;
          amount_cents: number;
          currency_id: string;
          status: string;
          payment_method: string | null;
          installments: number | null;
          due_date: string | null;
          paid_at: string | null;
          invoice_url: string | null;
          receipt_url: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          user_id: string;
          provider?: PaymentProvider;
          provider_payment_id?: string | null;
          provider_authorized_payment_id?: string | null;
          external_reference?: string | null;
          description?: string;
          amount_cents?: number;
          currency_id?: string;
          status?: string;
          payment_method?: string | null;
          installments?: number | null;
          due_date?: string | null;
          paid_at?: string | null;
          invoice_url?: string | null;
          receipt_url?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          subscription_id?: string;
          user_id?: string;
          provider?: PaymentProvider;
          provider_payment_id?: string | null;
          provider_authorized_payment_id?: string | null;
          external_reference?: string | null;
          description?: string;
          amount_cents?: number;
          currency_id?: string;
          status?: string;
          payment_method?: string | null;
          installments?: number | null;
          due_date?: string | null;
          paid_at?: string | null;
          invoice_url?: string | null;
          receipt_url?: string | null;
          metadata?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      payment_webhook_events: {
        Row: {
          id: string;
          provider: PaymentProvider;
          event_type: string;
          action: string | null;
          external_resource_id: string | null;
          request_id: string | null;
          signature_ts: number | null;
          payload: Json;
          query_params: Json;
          processing_status: string;
          processing_error: string | null;
          processed_at: string | null;
          subscription_id: string | null;
          user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider?: PaymentProvider;
          event_type: string;
          action?: string | null;
          external_resource_id?: string | null;
          request_id?: string | null;
          signature_ts?: number | null;
          payload?: Json;
          query_params?: Json;
          processing_status?: string;
          processing_error?: string | null;
          processed_at?: string | null;
          subscription_id?: string | null;
          user_id?: string | null;
          created_at?: string;
        };
        Update: {
          provider?: PaymentProvider;
          event_type?: string;
          action?: string | null;
          external_resource_id?: string | null;
          request_id?: string | null;
          signature_ts?: number | null;
          payload?: Json;
          query_params?: Json;
          processing_status?: string;
          processing_error?: string | null;
          processed_at?: string | null;
          subscription_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      email_jobs: {
        Row: {
          id: string;
          user_id: string | null;
          subscription_id: string | null;
          payment_transaction_id: string | null;
          provider: string;
          template_key: string;
          recipient_email: string;
          recipient_name: string | null;
          subject: string;
          dedupe_key: string | null;
          payload: Json;
          status: EmailJobStatus;
          scheduled_for: string;
          sent_at: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          subscription_id?: string | null;
          payment_transaction_id?: string | null;
          provider?: string;
          template_key: string;
          recipient_email: string;
          recipient_name?: string | null;
          subject: string;
          dedupe_key?: string | null;
          payload?: Json;
          status?: EmailJobStatus;
          scheduled_for?: string;
          sent_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string | null;
          subscription_id?: string | null;
          payment_transaction_id?: string | null;
          provider?: string;
          template_key?: string;
          recipient_email?: string;
          recipient_name?: string | null;
          subject?: string;
          dedupe_key?: string | null;
          payload?: Json;
          status?: EmailJobStatus;
          scheduled_for?: string;
          sent_at?: string | null;
          last_error?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      stories: {
        Row: {
          id: string;
          title: string;
          theme: string;
          category: ContentCategory;
          status: ContentStatus;
          access: ContentAccess;
          media_path: string | null;
          thumbnail_path: string | null;
          duration_seconds: number;
          reactions: Json;
          published_at: string | null;
          expires_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          theme?: string;
          category: ContentCategory;
          status?: ContentStatus;
          access?: ContentAccess;
          media_path?: string | null;
          thumbnail_path?: string | null;
          duration_seconds?: number;
          reactions?: Json;
          published_at?: string | null;
          expires_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          theme?: string;
          category?: ContentCategory;
          status?: ContentStatus;
          access?: ContentAccess;
          media_path?: string | null;
          thumbnail_path?: string | null;
          duration_seconds?: number;
          reactions?: Json;
          published_at?: string | null;
          expires_at?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stories_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      story_views: {
        Row: {
          story_id: string;
          user_id: string;
          seen_at: string;
        };
        Insert: {
          story_id: string;
          user_id: string;
          seen_at?: string;
        };
        Update: {
          seen_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey";
            columns: ["story_id"];
            isOneToOne: false;
            referencedRelation: "stories";
            referencedColumns: ["id"];
          },
        ];
      };
      user_preferences: {
        Row: {
          user_id: string;
          push_notifications: boolean;
          email_updates: boolean;
          study_reminders: boolean;
          marketing_emails: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          push_notifications?: boolean;
          email_updates?: boolean;
          study_reminders?: boolean;
          marketing_emails?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          push_notifications?: boolean;
          email_updates?: boolean;
          study_reminders?: boolean;
          marketing_emails?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      delete_own_account: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      subscription_status: SubscriptionStatus;
      payment_provider: PaymentProvider;
      email_job_status: EmailJobStatus;
      content_category: ContentCategory;
      content_status: ContentStatus;
      content_access: ContentAccess;
      content_type: ContentType;
      notification_target: NotificationTarget;
    };
    CompositeTypes: Record<string, never>;
  };
}
