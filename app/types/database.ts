import { PoolClient } from '@neondatabase/serverless';

// Database Error Types
export interface DatabaseError extends Error {
  code?: string;
  detail?: string;
  hint?: string;
  position?: string;
  sqlState?: string;
  sqlMessage?: string;
}

// Database Table Types
export interface Team {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MediaItem {
  id: number;
  team_id: number;
  item_type: 'photo' | 'video';
  item_number: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  metadata: Record<string, unknown> | null;
  is_processed: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UploadedItem {
  id: number;
  team_id: number;
  item_type: 'photo' | 'video';
  item_number: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  upload_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

// Database Query Result Types
export interface QueryResult<T> {
  rows: T[];
  rowCount: number;
  command: string;
}

// Database Client Types
export interface DatabaseClient extends PoolClient {
  query<T = unknown>(queryText: string, values?: unknown[]): Promise<QueryResult<T>>;
}

// Error Response Types
export interface ErrorResponse {
  error: string;
  details?: string;
  code?: string;
  timestamp: string;
}

// Utility Types
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>; 