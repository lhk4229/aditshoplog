'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { TICKET_STATUS_OPTIONS } from '@/constants/ticketOptions';
import { formatDate, formatDateTime, type TicketListResponse } from '@/types/ticket';
import styles from '@/styles/shared.module.css';

export default function TicketsPage() {
  const [data, setData] = useState<TicketListResponse | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    jira_key: '',
    ticket_name: '',
    status: '',
    assignee: '',
    deploy_date: '',
  });

  const loadTickets = useCallback(async () => {
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      Object.entries(filters).forEach(([key, value]) => {
        if (value.trim()) params.set(key, value.trim());
      });
      const result = await apiFetch<TicketListResponse>(`/api/tickets?${params}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '목록을 불러오지 못했습니다.');
    }
  }, [page, filters]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  async function handleDelete(id: number) {
    if (!confirm('이 티켓을 삭제하시겠습니까?')) return;
    try {
      await apiFetch(`/api/tickets/${id}`, { method: 'DELETE' });
      loadTickets();
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>티켓 목록</h1>
        <Link href="/tickets/new" className={styles.button}>
          + 티켓 등록
        </Link>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.field}>
          <label>지라번호</label>
          <input
            value={filters.jira_key}
            onChange={(e) => setFilters({ ...filters, jira_key: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label>티켓명</label>
          <input
            value={filters.ticket_name}
            onChange={(e) => setFilters({ ...filters, ticket_name: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label>처리현황</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">전체</option>
            {TICKET_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label>담당자</label>
          <input
            value={filters.assignee}
            onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label>배포일</label>
          <input
            type="date"
            value={filters.deploy_date}
            onChange={(e) => setFilters({ ...filters, deploy_date: e.target.value })}
          />
        </div>
        <button type="button" className={styles.buttonSecondary} onClick={() => setPage(1)}>
          검색
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>작성일자</th>
              <th>담당자</th>
              <th>배포일</th>
              <th>지라번호</th>
              <th>티켓명</th>
              <th>처리현황</th>
              <th>dev merge</th>
              <th>캡처 업로드</th>
              <th>최근 수정</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((ticket) => (
              <tr key={ticket.id}>
                <td>{formatDate(ticket.written_date)}</td>
                <td>{ticket.assignee ?? '-'}</td>
                <td>{formatDate(ticket.deploy_date)}</td>
                <td>
                  <Link href={`/tickets/${ticket.id}`} className={styles.linkButton}>
                    {ticket.jira_key}
                  </Link>
                </td>
                <td>{ticket.ticket_name}</td>
                <td>{ticket.status ?? '-'}</td>
                <td>{ticket.dev_merge_status ?? '-'}</td>
                <td>{ticket.capture_upload_status ?? '-'}</td>
                <td>
                  {ticket.last_modified_by_name
                    ? `${ticket.last_modified_by_name} / ${formatDateTime(ticket.last_modified_at)}`
                    : '-'}
                </td>
                <td>
                  <div className={styles.actions}>
                    <Link href={`/tickets/${ticket.id}/edit`} className={styles.linkButton}>
                      수정
                    </Link>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={() => handleDelete(ticket.id)}
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data?.data.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '32px' }}>
                  등록된 티켓이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.buttonSecondary}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            이전
          </button>
          <span>
            {data.pagination.page} / {data.pagination.totalPages} (총 {data.pagination.total}건)
          </span>
          <button
            type="button"
            className={styles.buttonSecondary}
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
