# Backend Setup Guide

## Current Status

The HistoRando admin dashboard is configured to use the production backend:
```
https://histo-rando-backend-egvh3.ondigitalocean.app/api/v1
```

### ✅ Working
- Health check endpoint
- API authentication protection (401 responses)
- CORS configuration
- HTTPS enabled

### ❌ Not Working
- User login (500 Internal Server Error)
- User registration (500 Internal Server Error)

## Problem Diagnosis

The auth endpoints (`/api/v1/auth/login` and `/api/v1/auth/register`) are returning 500 errors, indicating backend issues. This is likely due to:

1. **Database Connection Issues**
   - Database might not be properly connected
   - Connection string misconfigured
   - Database credentials expired

2. **Missing Database Tables/Schema**
   - User table might not exist
   - Schema migration not run
   - Table structure doesn't match entity definitions

3. **Validation/DTO Issues**
   - Password hashing failing
   - Entity validation errors
   - Missing required fields

## How to Fix (Backend Side)

### Step 1: Check Backend Logs

SSH into your DigitalOcean app or check logs via the dashboard:

```bash
# Via DigitalOcean CLI
doctl apps logs <app-id>

# Or via the web dashboard
https://cloud.digitalocean.com/apps
```

Look for error messages related to:
- Database connection
- User creation
- Password hashing
- Validation errors

### Step 2: Verify Database Connection

Ensure your backend has the correct database connection string:

```typescript
// In your backend .env or environment variables
DATABASE_URL=postgresql://user:password@host:port/database
```

Test the connection:

```typescript
// Add a simple test endpoint
@Get('db-test')
async testDb() {
  try {
    await this.userRepository.count();
    return { status: 'Database connected' };
  } catch (error) {
    return { status: 'Database error', error: error.message };
  }
}
```

### Step 3: Run Database Migrations

```bash
# If using TypeORM
npm run typeorm migration:run

# If using Prisma
npx prisma migrate deploy

# If using custom migrations
npm run migrate
```

### Step 4: Seed Admin User

Create a seed script to add an admin user:

```typescript
// seed-admin.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@historando.com' },
    update: {},
    create: {
      email: 'admin@historando.com',
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
    },
  });
  
  console.log('Admin user created:', admin);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run the seed:

```bash
npm run seed
# or
ts-node seed-admin.ts
```

### Step 5: Add Proper Error Handling

Update your auth service to provide better error messages:

```typescript
async login(loginDto: LoginDto) {
  try {
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      access_token: this.generateToken(user),
      user: this.sanitizeUser(user),
    };
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof UnauthorizedException) {
      throw error;
    }
    throw new InternalServerErrorException('Login failed: ' + error.message);
  }
}
```

## Testing After Fixes

Once you've fixed the backend, run the test script:

```bash
./test-backend.sh
```

You should see:
- ✓ Health Check: OK
- ✓ Protected Route: OK
- ✓ Login: SUCCESS
- ✓ Authenticated Request: SUCCESS

## Manual Database Admin Creation (SQL)

If you have direct database access:

```sql
-- Create admin user manually
INSERT INTO users (
  email,
  username,
  password,
  role,
  created_at,
  updated_at
) VALUES (
  'admin@historando.com',
  'admin',
  -- Bcrypt hash for 'Admin123!' (generate this using bcrypt)
  '$2b$10$K7L1OY2FGXcZf8T0fR8pVuXjP3EYwFZc8qQX3LQN5QZ0X3YmvLQv6',
  'admin',
  NOW(),
  NOW()
);
```

To generate the password hash:

```bash
# Using Node.js
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Admin123!', 10).then(console.log);"

# Using online tool
# Visit: https://bcrypt-generator.com/
# Input: Admin123!
# Rounds: 10
```

## Alternative: Use Backend Console

If your backend framework has a console:

```bash
# NestJS CLI
npm run console

# Then in the console:
const user = await app.get(UserService).create({
  email: 'admin@historando.com',
  username: 'admin',
  password: 'Admin123!',
  role: 'admin',
});
```

## Environment Variables Checklist

Ensure these are set in your DigitalOcean app environment:

```env
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Other
NODE_ENV=production
PORT=8080
```

## Support

If you continue having issues:

1. Check DigitalOcean app logs
2. Verify database is running and accessible
3. Test database connection separately
4. Run migrations
5. Seed admin user
6. Restart the app

For more details, see `ADMIN_CREDENTIALS.md`.
