'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchCurrentUser, logout, type AuthUser } from '@/lib/api';
import styles from './Header.module.css';

export function Header() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    fetchCurrentUser().then(setUser);
  }, []);

  async function handleLogout() {
    await logout();
  }

  return (
    <header className={styles.header}>
      <Link href="/tickets" className={styles.logo}>
        Aditshoplog
      </Link>
      <nav className={styles.nav}>
        {user ? (
          <>
            <span className={styles.user}>{user.name}님</span>
            <Link href="/tickets">티켓 목록</Link>
            <Link href="/tickets/new">티켓 등록</Link>
            <button type="button" onClick={handleLogout} className={styles.logout}>
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link href="/login">로그인</Link>
            <Link href="/signup">회원가입</Link>
          </>
        )}
      </nav>
    </header>
  );
}
