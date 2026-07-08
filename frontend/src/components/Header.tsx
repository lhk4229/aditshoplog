'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchCurrentUser, logout, type AuthUser } from '@/lib/api';
import sharedStyles from '@/styles/shared.module.css';
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
        Adit<span className={styles.logoAccent}>shop</span>log
      </Link>
      <nav className={styles.nav}>
        {user ? (
          <>
            <span className={styles.user}>{user.name}님</span>
            <Link href="/tickets">티켓 목록</Link>
            <Link href="/tickets/new">티켓 등록</Link>
            <button type="button" onClick={handleLogout} className={sharedStyles.buttonSecondary}>
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
