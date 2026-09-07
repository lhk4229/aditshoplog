import app from './app';
import { env } from './config/env';
import { isSmtpConfigured, verifySmtp } from './lib/mail';

app.listen(env.port, '0.0.0.0', () => {
  console.log(`Aditshoplog API running on http://0.0.0.0:${env.port}`);
  console.log(`Swagger docs: http://0.0.0.0:${env.port}/api-docs`);
  if (!isSmtpConfigured()) {
    console.warn('Mail: SMTP is not configured — verification/reset emails will fail');
    return;
  }
  console.log(`Mail: SMTP ${env.smtpHost}:${env.smtpPort} from=${env.mailFrom}`);
  void verifySmtp()
    .then(() => console.log('Mail: SMTP connection verified'))
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Mail: SMTP verify failed — ${message}`);
    });
});
