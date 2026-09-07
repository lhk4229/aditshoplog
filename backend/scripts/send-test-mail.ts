import { env } from '../src/config/env';
import { sendPasswordResetEmail } from '../src/lib/mail';

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error('usage: tsx scripts/send-test-mail.ts <email>');
    process.exitCode = 1;
    return;
  }

  console.log(`from=${env.mailFrom} host=${env.smtpHost}:${env.smtpPort} appUrl=${env.appUrl}`);
  await sendPasswordResetEmail(to, 'test-token-not-valid');
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
