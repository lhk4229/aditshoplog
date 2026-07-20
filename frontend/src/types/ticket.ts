export interface Ticket {
  id: number;
  title: string;
  jira_key: string;
  ticket_name: string;
  assignee: string | null;
  written_date: string | null;
  deploy_date: string | null;
  aditshop_branch_note: string | null;
  newbqr_branch_note: string | null;
  related_links: string | null;
  status: string | null;
  dev_merge_status: string | null;
  capture_upload_status: string | null;
  writer_id: number;
  writer_name: string;
  last_modified_by: number | null;
  last_modified_by_name: string | null;
  last_modified_at: string | null;
  created_at: string;
  updated_at: string;
  latest_remark_content?: string | null;
}

export interface TicketListResponse {
  data: Ticket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Remark {
  id: number;
  ticket_id: number;
  author_id: number;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface RemarkListResponse {
  data: Remark[];
}

export { formatDate, formatDateTime } from '@/lib/date';
