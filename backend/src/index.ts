import app from './app';
import { env } from './config/env';

app.listen(env.port, '0.0.0.0', () => {
  console.log(`Aditshoplog API running on http://0.0.0.0:${env.port}`);
  console.log(`Swagger docs: http://0.0.0.0:${env.port}/api-docs`);
});
