import app from './app';
import { env } from './config/env';

app.listen(env.port, () => {
  console.log(`AditShopLog API running on http://localhost:${env.port}`);
  console.log(`Swagger docs: http://localhost:${env.port}/api-docs`);
});
