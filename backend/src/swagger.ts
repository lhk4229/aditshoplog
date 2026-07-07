import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './config/env';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Aditshoplog API',
      version: '1.0.0',
      description: 'Aditshoplog 업무 티켓 관리 API',
    },
    servers: [{ url: `http://localhost:${env.port}` }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
});
