'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from '@/styles/shared.module.css';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('인증 토큰이 없습니다.');
      return;
    }

    let cancelled = false;

    apiFetch('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(() => {
        if (!cancelled) {
          setDone(true);
          window.location.href = '/tickets';
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '인증에 실패했습니다.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>이메일 인증</h1>
      {error ? (
        <>
          <div className={styles.error}>{error}</div>
          <p className={styles.linkRow}>
            <Link href="/login">로그인으로 이동</Link>
          </p>
        </>
      ) : (
        <p className={styles.subtitle}>
          {done ? '인증이 완료되었습니다. 이동합니다...' : '인증을 확인하고 있습니다...'}
        </p>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className={styles.card}>인증을 확인하고 있습니다...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
