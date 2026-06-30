'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { toDateInputValue } from '@/lib/date';
import { DEV_MERGE_OPTIONS, TICKET_STATUS_OPTIONS } from '@/constants/ticketOptions';
import { type Ticket } from '@/types/ticket';
import styles from '@/styles/shared.module.css';

export default function EditTicketPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadTicket() {
      try {
        const ticket = await apiFetch<Ticket>(`/api/tickets/${id}`);
        setForm({
          jira_key: ticket.jira_key,
          ticket_name: ticket.ticket_name,
          assignee: ticket.assignee ?? '',
          written_date: toDateInputValue(ticket.written_date),
          deploy_date: toDateInputValue(ticket.deploy_date),
          aditshop_branch_note: ticket.aditshop_branch_note ?? '',
          newbqr_branch_note: ticket.newbqr_branch_note ?? '',
          related_links: ticket.related_links ?? '',
          status: ticket.status ?? '',
          dev_merge_status: ticket.dev_merge_status ?? '',
          capture_upload_status: ticket.capture_upload_status ?? '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '티켓을 불러오지 못했습니다.');
      }
    }

    if (!Number.isNaN(id)) loadTicket();
  }, [id]);

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiFetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      router.push(`/tickets/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>티켓 수정</h1>
        <Link href={`/tickets/${id}`} className={styles.buttonSecondary}>
          상세로
        </Link>
      </div>

      <form className={styles.detailGrid} onSubmit={handleSubmit}>
        {error && <div className={styles.error}>{error}</div>}

        {[
          ['jira_key', '지라번호 *'],
          ['ticket_name', '티켓명 *'],
          ['assignee', '담당자'],
          ['written_date', '작성일자'],
          ['deploy_date', '배포일'],
        ].map(([key, label]) => (
          <div className={styles.field} key={key}>
            <label>{label}</label>
            <input
              type={key.includes('date') ? 'date' : 'text'}
              value={form[key] ?? ''}
              onChange={(e) => updateField(key, e.target.value)}
              required={key === 'jira_key' || key === 'ticket_name'}
            />
          </div>
        ))}

        <div className={styles.field}>
          <label>처리현황</label>
          <select value={form.status ?? ''} onChange={(e) => updateField('status', e.target.value)}>
            <option value="">선택</option>
            {TICKET_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label>dev merge</label>
          <select
            value={form.dev_merge_status ?? ''}
            onChange={(e) => updateField('dev_merge_status', e.target.value)}
          >
            <option value="">선택</option>
            {DEV_MERGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label>캡처 업로드</label>
          <input
            value={form.capture_upload_status ?? ''}
            onChange={(e) => updateField('capture_upload_status', e.target.value)}
          />
        </div>

        {[
          ['aditshop_branch_note', 'aditshop repo 브랜치 업로드'],
          ['newbqr_branch_note', 'newbqr repo 브랜치 업로드'],
          ['related_links', '관련 파일 및 링크'],
        ].map(([key, label]) => (
          <div className={styles.field} key={key}>
            <label>{label}</label>
            <textarea
              value={form[key] ?? ''}
              onChange={(e) => updateField(key, e.target.value)}
            />
          </div>
        ))}

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? '저장 중...' : '저장'}
        </button>
      </form>
    </div>
  );
}
