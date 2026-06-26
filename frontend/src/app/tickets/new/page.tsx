'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { type Ticket } from '@/types/ticket';
import styles from '@/styles/shared.module.css';

const emptyForm = {
  jira_key: '',
  ticket_name: '',
  assignee: '',
  written_date: '',
  deploy_date: '',
  aditshop_branch_note: '',
  newbqr_branch_note: '',
  related_links: '',
  status: '',
  dev_merge_status: '',
  capture_upload_status: '',
};

export default function NewTicketPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(key: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const ticket = await apiFetch<Ticket>('/api/tickets', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      router.push(`/tickets/${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>티켓 등록</h1>
        <Link href="/tickets" className={styles.buttonSecondary}>
          목록으로
        </Link>
      </div>

      <form className={styles.detailGrid} onSubmit={handleSubmit}>
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label>지라번호 *</label>
          <input
            value={form.jira_key}
            onChange={(e) => updateField('jira_key', e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label>티켓명 *</label>
          <input
            value={form.ticket_name}
            onChange={(e) => updateField('ticket_name', e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label>담당자</label>
          <input value={form.assignee} onChange={(e) => updateField('assignee', e.target.value)} />
        </div>
        <div className={styles.field}>
          <label>작성일자</label>
          <input
            type="date"
            value={form.written_date}
            onChange={(e) => updateField('written_date', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>배포일</label>
          <input
            type="date"
            value={form.deploy_date}
            onChange={(e) => updateField('deploy_date', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>aditshop repo 브랜치 업로드</label>
          <textarea
            value={form.aditshop_branch_note}
            onChange={(e) => updateField('aditshop_branch_note', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>newbqr repo 브랜치 업로드</label>
          <textarea
            value={form.newbqr_branch_note}
            onChange={(e) => updateField('newbqr_branch_note', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>관련 파일 및 링크</label>
          <textarea
            value={form.related_links}
            onChange={(e) => updateField('related_links', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>처리현황</label>
          <input value={form.status} onChange={(e) => updateField('status', e.target.value)} />
        </div>
        <div className={styles.field}>
          <label>dev merge</label>
          <input
            value={form.dev_merge_status}
            onChange={(e) => updateField('dev_merge_status', e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label>캡처 업로드</label>
          <input
            value={form.capture_upload_status}
            onChange={(e) => updateField('capture_upload_status', e.target.value)}
          />
        </div>

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? '등록 중...' : '등록'}
        </button>
      </form>
    </div>
  );
}
