#!/bin/bash
# Backend CORS fix untuk allow frontend domain

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Backend CORS Fix untuk Frontend Domain${NC}"

# Create backend CORS configuration
cat > ../backend-cors-update.md << 'EOF'
# Backend CORS Configuration Update

## Problem
Frontend di `customer.merahputih-id.com` tidak bisa access backend `bc.merahputih-id.com` karena CORS policy.

## Solution
Update file `src/main.ts` di backend NestJS:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure CORS
  app.enableCors({
    origin: [
      'https://customer.merahputih-id.com',    // Production frontend
      'http://localhost:5173',                 // Development frontend
      'http://localhost:3000',                 // Alternative dev port
      'https://localhost:5173'                 // HTTPS dev
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });

  // Global prefix for API routes
  app.setGlobalPrefix('api', {
    exclude: ['/health', '/']
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);
  
  console.log(`🚀 Backend running on: http://localhost:${port}`);
  console.log(`🌐 CORS enabled for: customer.merahputih-id.com`);
}

bootstrap();
```

## Deployment Commands

```bash
# On backend server
cd /var/www/bc.merahputih-id.com
npm run build
pm2 restart merahputih-backend
pm2 logs merahputih-backend --lines 20
```

## Verification

Test CORS:
```bash
curl -H "Origin: https://customer.merahputih-id.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://bc.merahputih-id.com/api/auth/login
```

Should return:
```
Access-Control-Allow-Origin: https://customer.merahputih-id.com
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
```
EOF

echo -e "${GREEN}✅ Backend CORS fix documentation created${NC}"
echo -e "${YELLOW}File created: ../backend-cors-update.md${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "1. Frontend: customer.merahputih-id.com → PM2 serve on :3000"
echo "2. Backend: bc.merahputih-id.com → PM2 NestJS on :5000"  
echo "3. Nginx: Reverse proxy both domains"
echo "4. CORS: Backend allows frontend domain"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Deploy frontend: ./deploy-production-pm2.sh"
echo "2. Update backend CORS (see ../backend-cors-update.md)"
echo "3. Test: https://customer.merahputih-id.com"
