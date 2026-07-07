import app from './app';
import { env } from './config/env';

app.listen(env.port, () => {
  console.log(`Aditshoplog API running on http://localhost:${env.port}`);
  console.log(`Swagger docs: http://localhost:${env.port}/api-docs`);
});
