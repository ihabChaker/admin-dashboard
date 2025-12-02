# Admin Credentials for HistoRando Dashboard

## Production Backend URL
```
https://histo-rando-backend-egvh3.ondigitalocean.app/api/v1
```

## Admin Credentials

**IMPORTANT:** These credentials need to be created in the production database manually or through a seed script.

### Default Admin Account
```
Email: admin@historando.com
Password: Admin123!
Username: admin
Role: admin
```

### Alternative Admin Account
```
Email: admin@histo-rando.com
Password: HistoRando2024!
Username: historando_admin
Role: admin
```

## Backend Setup Instructions

The production backend is currently experiencing issues with user registration (500 errors). To set up admin access:

### Option 1: Database Seeding (Recommended)
Create a seed script in your backend to insert admin users directly into the database:

```sql
-- Example SQL to create admin user (adjust based on your schema)
INSERT INTO users (email, username, password_hash, role, created_at, updated_at)
VALUES (
  'admin@historando.com',
  'admin',
  -- Use bcrypt to hash 'Admin123!'
  '$2b$10$YourHashedPasswordHere',
  'admin',
  NOW(),
  NOW()
);
```

### Option 2: Backend Admin Creation Endpoint
Create a special endpoint or CLI command in your backend to create admin users:

```typescript
// Example NestJS command or endpoint
async createAdmin() {
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  return await this.userRepository.save({
    email: 'admin@historando.com',
    username: 'admin',
    password: hashedPassword,
    role: 'admin',
  });
}
```

### Option 3: Fix Registration Endpoint
The `/api/v1/auth/register` endpoint is returning 500 errors. Check:
- Database connection and permissions
- User model validation
- Required fields in the registration DTO
- Database constraints and unique indexes

## API Testing Results

✅ **Backend Health Check**: OK (Status: 200)
- Health endpoint: https://histo-rando-backend-egvh3.ondigitalocean.app/api/v1/health
- Environment: production
- Version: 1.0.0

❌ **User Registration**: FAILING (Status: 500)
- Endpoint: POST /api/v1/auth/register
- Error: "Internal server error"
- Required fields: email, username, password

❌ **User Login**: FAILING (Status: 500)
- Endpoint: POST /api/v1/auth/login
- Error: "Internal server error"
- Required fields: email, password

✅ **Protected Routes**: Working (Status: 401 without token)
- Endpoint: GET /api/v1/users
- Correctly returns "Token manquant" (unauthorized)

## Next Steps

1. **Fix Backend Registration/Login Issues**
   - Check backend logs for detailed error messages
   - Verify database connection and schema
   - Test auth endpoints locally first

2. **Create Admin User**
   - Use one of the methods above to create an admin user
   - Verify the user has role='admin' in the database

3. **Test Admin Dashboard**
   - Login at: http://localhost:3000/login (development)
   - Use the admin credentials created in step 2
   - Verify access to all dashboard routes

## Environment Variables

The dashboard is configured with:
```env
NEXT_PUBLIC_API_URL=https://histo-rando-backend-egvh3.ondigitalocean.app/api/v1
```

This is set in `.env.local` file.

## Security Notes

- Change default passwords after first login
- Use strong passwords for production
- Enable HTTPS for all admin access
- Consider implementing 2FA for admin accounts
- Regularly rotate admin credentials
- Store credentials in a secure password manager
- Never commit credentials to version control

---

**Last Updated**: December 2, 2025
**Status**: Backend auth endpoints need fixing before admin access is possible
