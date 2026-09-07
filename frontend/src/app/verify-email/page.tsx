'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from '@/styles/shared.module.css';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleVerify() {
    setError('');
    setLoading(true);

    try {
      await apiFetch('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      window.location.href = '/tickets';
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증에 실패했습니다.');
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>이메일 인증</h1>
        <div className={styles.error}>인증 토큰이 없습니다.</div>
        <p className={styles.linkRow}>
          <Link href="/login">로그인으로 이동</Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>이메일 인증</h1>
      <p className={styles.subtitle}>아래 버튼을 눌러 가입을 완료해 주세요</p>
      <div className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}
        <button
          type="button"
          className={styles.button}
          onClick={handleVerify}
          disabled={loading}
        >
          {loading ? '인증 중...' : '이메일 인증하기'}
        </button>
      </div>
      <p className={styles.linkRow}>
        <Link href="/login">로그인으로 이동</Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className={styles.card}>불러오는 중...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
