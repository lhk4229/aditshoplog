'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { ApiError, apiFetch, type AuthResponse } from '@/lib/api';
import styles from '@/styles/shared.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setUnverified(false);
    setLoading(true);

    try {
      await apiFetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      window.location.href = '/tickets';
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setUnverified(true);
      }
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setMessage('');
    try {
      const data = await apiFetch<{ message: string }>('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : '재발송에 실패했습니다.');
    }
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>로그인</h1>
      <p className={styles.subtitle}>Aditshoplog 업무 티켓 관리</p>
      <form className={styles.form} onSubmit={handleSubmit}>
        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.success}>{message}</div>}
        <div className={styles.field}>
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </button>
        {unverified && (
          <button type="button" className={styles.buttonSecondary} onClick={handleResend}>
            인증 메일 다시 보내기
          </button>
        )}
      </form>
      <p className={styles.linkRow}>
        <Link href="/forgot-password">비밀번호를 잊으셨나요?</Link>
      </p>
      <p className={styles.linkRow}>
        계정이 없으신가요? <Link href="/signup">회원가입</Link>
      </p>
    </div>
  );
}
