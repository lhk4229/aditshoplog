export const TICKET_STATUS_OPTIONS = [
  '작업 대기중',
  '작업중',
  '보류',
  '테스트 후 완료',
  '개발 전달 완료',
  '완료',
] as const;

export const DEV_MERGE_OPTIONS = ['branch', 'dev'] as const;

export const CAPTURE_UPLOAD_OPTIONS = ['완료', '불필요', '미완료'] as const;

export const DEFAULT_CAPTURE_UPLOAD_STATUS = '미완료';
