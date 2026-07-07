const KST = 'Asia/Seoul';
const LOCALE = 'ko-KR';

function parseDateOnly(value: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00+09:00`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatDate(value: string | null) {
  if (!value) return '-';
  const date = parseDateOnly(value);
  if (!date) return '-';
  return date.toLocaleDateString(LOCALE, { timeZone: KST });
}

export function formatDateTime(value: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(LOCALE, {
    timeZone: KST,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** HTML date input용 YYYY-MM-DD (KST 기준) */
export function toDateInputValue(value: string | null) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = parseDateOnly(value);
  if (!date) return '';

  return date.toLocaleDateString('sv-SE', { timeZone: KST });
}

/** 오늘 날짜 YYYY-MM-DD (KST 기준) */
export function todayInKst() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: KST });
}
