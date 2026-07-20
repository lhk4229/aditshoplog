'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, fetchCurrentUser, type AuthUser } from '@/lib/api';
import {
  formatDate,
  formatDateTime,
  type Remark,
  type RemarkListResponse,
  type Ticket,
} from '@/types/ticket';
import styles from '@/styles/shared.module.css';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [remarkContent, setRemarkContent] = useState('');
  const [editingRemarkId, setEditingRemarkId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  async function loadAll() {
    try {
      const [ticketData, remarkData] = await Promise.all([
        apiFetch<Ticket>(`/api/tickets/${id}`),
        apiFetch<RemarkListResponse>(`/api/tickets/${id}/remarks`),
      ]);
      setTicket(ticketData);
      setRemarks(remarkData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '티켓을 불러오지 못했습니다.');
    }
  }

  useEffect(() => {
    if (!Number.isNaN(id)) loadAll();
    fetchCurrentUser().then(setCurrentUser);
  }, [id]);

  async function handleRemarkSubmit(e: FormEvent) {
    e.preventDefault();
    if (!remarkContent.trim()) return;

    try {
      await apiFetch(`/api/tickets/${id}/remarks`, {
        method: 'POST',
        body: JSON.stringify({ content: remarkContent }),
      });
      setRemarkContent('');
      loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : '리마크 작성에 실패했습니다.');
    }
  }

  function startRemarkEdit(remark: Remark) {
    setEditingRemarkId(remark.id);
    setEditContent(remark.content);
  }

  function cancelRemarkEdit() {
    setEditingRemarkId(null);
    setEditContent('');
  }

  async function handleRemarkUpdate(e: FormEvent) {
    e.preventDefault();
    if (editingRemarkId === null || !editContent.trim()) return;

    try {
      await apiFetch(`/api/remarks/${editingRemarkId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content: editContent }),
      });
      setEditingRemarkId(null);
      setEditContent('');
      loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : '리마크 수정에 실패했습니다.');
    }
  }

  async function handleRemarkDelete(remarkId: number) {
    if (!confirm('리마크를 삭제하시겠습니까?')) return;
    try {
      await apiFetch(`/api/remarks/${remarkId}`, { method: 'DELETE' });
      if (editingRemarkId === remarkId) cancelRemarkEdit();
      loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  }

  async function handleDeleteTicket() {
    if (!confirm('이 티켓을 삭제하시겠습니까?')) return;
    try {
      await apiFetch(`/api/tickets/${id}`, { method: 'DELETE' });
      router.push('/tickets');
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  }

  if (error) return <div className={styles.error}>{error}</div>;
  if (!ticket) return <p className={styles.loading}>불러오는 중...</p>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>{ticket.title}</h1>
        <div className={styles.actions}>
          <Link href={`/tickets/${id}/edit`} className={styles.buttonSecondary}>
            수정
          </Link>
          <button type="button" className={styles.buttonDanger} onClick={handleDeleteTicket}>
            삭제
          </button>
        </div>
      </div>

      <div className={styles.detailGrid}>
        <DetailRow label="작성일자" value={formatDate(ticket.written_date)} />
        <DetailRow label="담당자" value={ticket.assignee ?? '-'} />
        <DetailRow label="배포일" value={formatDate(ticket.deploy_date)} />
        <DetailRow label="지라번호" value={ticket.jira_key} />
        <DetailRow label="티켓명" value={ticket.ticket_name} />
        <DetailRow label="aditshop repo" value={ticket.aditshop_branch_note ?? '-'} />
        <DetailRow label="newbqr repo" value={ticket.newbqr_branch_note ?? '-'} />
        <DetailRow label="관련 파일 및 링크" value={ticket.related_links ?? '-'} />
        <DetailRow label="처리현황" value={ticket.status ?? '-'} />
        <DetailRow label="dev merge" value={ticket.dev_merge_status ?? '-'} />
        <DetailRow label="캡처 업로드" value={ticket.capture_upload_status ?? '-'} />
      </div>

      <div className={styles.metaBox}>
        <div>최초 작성자: {ticket.writer_name}</div>
        <div>마지막 수정자: {ticket.last_modified_by_name ?? ticket.writer_name}</div>
        <div>마지막 수정일: {formatDateTime(ticket.last_modified_at ?? ticket.updated_at)}</div>
      </div>

      <section className={styles.remarkList}>
        <h2>리마크</h2>
        {remarks.map((remark) => {
          const isOwner = currentUser?.id === remark.author_id;
          const isEditing = editingRemarkId === remark.id;

          return (
            <div key={remark.id} className={styles.remarkItem}>
              <div className={styles.remarkMeta}>
                <span>
                  {remark.author_name} · {formatDateTime(remark.created_at)}
                  {remark.updated_at !== remark.created_at &&
                    ` · 수정 ${formatDateTime(remark.updated_at)}`}
                </span>
                {isOwner && !isEditing && (
                  <div className={styles.remarkActions}>
                    <button
                      type="button"
                      className={styles.linkButton}
                      onClick={() => startRemarkEdit(remark)}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className={styles.dangerButton}
                      onClick={() => handleRemarkDelete(remark.id)}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
              {isEditing ? (
                <form className={styles.form} onSubmit={handleRemarkUpdate}>
                  <div className={styles.field}>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.buttonSecondary}
                      onClick={cancelRemarkEdit}
                    >
                      취소
                    </button>
                    <button type="submit" className={styles.button}>
                      저장
                    </button>
                  </div>
                </form>
              ) : (
                <div>{remark.content}</div>
              )}
            </div>
          );
        })}

        <form className={styles.form} onSubmit={handleRemarkSubmit}>
          <div className={styles.field}>
            <label>리마크 작성</label>
            <textarea
              value={remarkContent}
              onChange={(e) => setRemarkContent(e.target.value)}
              placeholder="진행 메모를 입력하세요"
            />
          </div>
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={() => setRemarkContent('')}
            >
              취소
            </button>
            <button type="submit" className={styles.button}>
              리마크 등록
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <div className={styles.detailLabel}>{label}</div>
      <div className={styles.detailValue}>{value}</div>
    </div>
  );
}
