'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from '@/styles/shared.module.css';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      window.location.href = '/tickets';
    } catch (err) {
      setError(err instanceof Error ? err.message : '재설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>비밀번호 재설정</h1>
        <div className={styles.error}>재설정 토큰이 없습니다.</div>
        <p className={styles.linkRow}>
          <Link href="/forgot-password">다시 요청하기</Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>새 비밀번호</h1>
      <p className={styles.subtitle}>새 비밀번호를 입력해 주세요</p>
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.field}>
          <label htmlFor="password">비밀번호 (6자 이상)</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? '변경 중...' : '비밀번호 변경'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className={styles.card}>불러오는 중...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
