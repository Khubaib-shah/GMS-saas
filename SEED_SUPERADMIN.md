# Superadmin Seed Instructions

## Quick Method: Using the API Endpoint

I've created an API endpoint to easily create a superadmin user. Use one of these methods:

### Method 1: Using Postman or Thunder Client (Recommended)

1. **Open Postman or Thunder Client** (VS Code extension)
2. **Create a POST request** to: `http://localhost:3000/api/seed/superadmin`
3. **Set Headers:** `Content-Type: application/json`
4. **Body (JSON):**
```json
{
  "email": "admin@gmsaas.com",
  "password": "admin123",
  "fullName": "Super Admin",
  "confirmSecret": "create-superadmin-2024"
}
```
5. **Send the request**

### Method 2: Using PowerShell

Open PowerShell and run:

```powershell
$body = @{
    email = "admin@gmsaas.com"
    password = "admin123"
    fullName = "Super Admin"
    confirmSecret = "create-superadmin-2024"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/seed/superadmin" -Method POST -Body $body -ContentType "application/json"
```

### Method 3: Using curl

```bash
curl -X POST http://localhost:3000/api/seed/superadmin \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@gmsaas.com\",\"password\":\"admin123\",\"fullName\":\"Super Admin\",\"confirmSecret\":\"create-superadmin-2024\"}"
```

## Default Credentials

After seeding, you can login with:
- **Email:** `admin@gmsaas.com`
- **Password:** `admin123`

⚠️ **IMPORTANT:** Change these credentials after first login!

## Customization

You can customize the superadmin details in the request body:
- `email` - Superadmin email address
- `password` - Superadmin password
- `fullName` - Display name
- `confirmSecret` - Must match "create-superadmin-2024" (or set SEED_SECRET env variable)

## Troubleshooting

- **403 Invalid secret** - Make sure `confirmSecret` is exactly "create-superadmin-2024"
- **400 User already exists** - A user with that email already exists in the database
- **500 Internal Server Error** - Check if MongoDB is running and the dev server is started

## Security Note

For production, remove this endpoint or add stronger authentication!
