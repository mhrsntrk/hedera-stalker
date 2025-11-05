import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for single-page app
        scriptSrcAttr: ["'unsafe-hashes'"], // Allow event handlers
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Global validation pipe with sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration - allow specific origins in production
  // Normalize origins: trim, remove trailing slashes, and convert to lowercase for comparison
  const normalizeOrigin = (url: string) => {
    return url.trim().replace(/\/+$/, '').toLowerCase();
  };
  
  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => normalizeOrigin(o))
    : [];
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman, same-origin requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // In development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      
      // In production, check allowed origins
      if (allowedOrigins.length === 0) {
        // If no CORS_ORIGINS is set, allow all (for self-hosted apps on same domain)
        // This is safe since the app is served from the same domain
        return callback(null, true);
      }
      
      // Normalize the incoming origin for comparison
      const normalizedOrigin = normalizeOrigin(origin);
      
      // Check if origin is in allowed list (case-insensitive, trailing-slash insensitive)
      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }
      
      // Log for debugging
      console.warn(`CORS: Origin "${origin}" (normalized: "${normalizedOrigin}") not in allowed list:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  await app.listen(process.env.PORT || 3000);
}
bootstrap();

