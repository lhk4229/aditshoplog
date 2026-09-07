import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

const lastSentAt = new Map<string, number>();
const RESEND_COOLDOWN_MS = 60 * 1000;

function mailFromAddress(): string {
  const from = env.mailFrom.trim();
  if (!from) {
    return from;
  }
  return from.includes('<') ? from : `Aditshoplog <${from}>`;
}

export function isSmtpConfigured(): boolean {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass && env.mailFrom);
}

function assertSmtpConfigured(): void {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass || !env.mailFrom) {
    throw new AppError(
      500,
      'SMTP 설정이 없어 메일을 보낼 수 없습니다. SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM을 확인하고 서버를 재시작해 주세요.'
    );
  }
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  assertSmtpConfigured();
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth: { user: env.smtpUser, pass: env.smtpPass },
      requireTLS: env.smtpPort === 587,
      tls: { rejectUnauthorized: !env.smtpTlsInsecure },
    });
  }
  return transporter;
}

export async function verifySmtp(): Promise<void> {
  if (!isSmtpConfigured()) {
    throw new Error('SMTP is not configured');
  }
  await getTransporter().verify();
}

export function assertNotRateLimited(key: string): void {
  const previous = lastSentAt.get(key);
  if (previous && Date.now() - previous < RESEND_COOLDOWN_MS) {
    throw new AppError(429, '잠시 후 다시 시도해 주세요.');
  }
}

export function markSent(key: string): void {
  lastSentAt.set(key, Date.now());
}

function logMailDev(to: string, subject: string, url: string): void {
  if (env.nodeEnv === 'production') {
    return;
  }
  console.log(`[mail] ${subject}`);
  console.log(`[mail] to=${to}`);
  console.log(`[mail] ${url}`);
}

function linkMailHtml(body: string, url: string, actionLabel: string): string {
  const safeUrl = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;line-height:1.6;color:#222;">
  <p>${body}</p>
  <p><a href="${safeUrl}" target="_blank" rel="noopener">${actionLabel}</a></p>
  <p style="font-size:13px;color:#666;">버튼이 동작하지 않으면 아래 주소를 브라우저에 붙여 넣어 주세요.<br>${safeUrl}</p>
</body>
</html>`;
}

async function sendMail(to: string, subject: string, text: string, html: string): Promise<void> {
  assertSmtpConfigured();

  try {
    const info = await getTransporter().sendMail({
      from: mailFromAddress(),
      to,
      subject,
      text,
      html,
    });
    console.log(`[mail] sent ${subject} to=${to} id=${info.messageId ?? '-'} response=${info.response ?? '-'}`);
  } catch (error) {
    const err = error as { message?: string; response?: string; responseCode?: number };
    console.error('[mail] send failed:', err.response ?? err.message ?? error);
    throw new AppError(502, '메일 발송에 실패했습니다. SMTP 설정과 발신 주소 인증을 확인해 주세요.');
  }
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const url = `${env.appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  logMailDev(to, '[Aditshoplog] 이메일 인증', url);
  await sendMail(
    to,
    '[Aditshoplog] 이메일 인증',
    `회원가입을 완료하려면 아래 링크를 30분 안에 열어 주세요.\n\n${url}\n`,
    linkMailHtml(
      '회원가입을 완료하려면 아래 링크를 30분 안에 열어 주세요.',
      url,
      '이메일 인증하기'
    )
  );
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const url = `${env.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  logMailDev(to, '[Aditshoplog] 비밀번호 재설정', url);
  await sendMail(
    to,
    '[Aditshoplog] 비밀번호 재설정',
    `비밀번호를 재설정하려면 아래 링크를 30분 안에 열어 주세요.\n\n${url}\n\n요청하지 않으셨다면 이 메일은 무시해 주세요.\n`,
    linkMailHtml(
      '비밀번호를 재설정하려면 아래 링크를 30분 안에 열어 주세요.',
      url,
      '비밀번호 재설정하기'
    )
  );
}
