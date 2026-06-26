'use client';

import { useEffect } from 'react';
import { fetchCurrentUser } from '@/lib/api';

export default function HomePage() {
  useEffect(() => {
    fetchCurrentUser().then((user) => {
      window.location.href = user ? '/tickets' : '/login';
    });
  }, []);

  return <p>이동 중...</p>;
}
