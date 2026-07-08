'use client';

import { useEffect } from 'react';
import { fetchCurrentUser } from '@/lib/api';
import styles from '@/styles/shared.module.css';

export default function HomePage() {
  useEffect(() => {
    fetchCurrentUser().then((user) => {
      window.location.href = user ? '/tickets' : '/login';
    });
  }, []);

  return <p className={styles.loading}>이동 중...</p>;
}
