# WardConnect API Server

## Setup

1. Copy `.env.example` to `.env` and fill in your database credentials and JWT secret.
2. Run the migrations against your MySQL database:
   ```bash
   # Option A: Apply SQL directly
   mysql -u user -p wardconnect < drizzle/0000_elite_eternals.sql
   mysql -u user -p wardconnect < drizzle/0001_auth_ward_selection.sql
   mysql -u user -p wardconnect < drizzle/0002_core_tables.sql

   # Option B: Use drizzle-kit (requires DATABASE_URL in .env)
   pnpm db:push
   ```
3. Start the dev server: `pnpm dev:server`

## Example API Requests

All examples assume the server is running on `http://localhost:3000`.

### Auth

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","wardId":6}'

# Login (save the token)
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq -r '.token')

# Get current user
curl http://localhost:3000/api/auth/me -H "Authorization: Bearer $TOKEN"

# List wards
curl http://localhost:3000/api/wards
```

### Issues

```bash
# Create issue (authenticated)
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"category":"Waterlogging","title":"Blocked drain on Road 7","description":"Standing water is blocking the footpath beside the community school. The drain has been blocked for three days.","severity":"normal","landmark":"Near Mirpur Community School"}'

# List issues (public)
curl "http://localhost:3000/api/issues?limit=10&offset=0"

# List issues by ward
curl "http://localhost:3000/api/issues?wardId=6"

# Get single issue
curl http://localhost:3000/api/issues/1

# Update issue status (admin only — set isAdmin=true on your user first)
curl -X PATCH http://localhost:3000/api/issues/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"acknowledged"}'
```

### SOS Alerts

```bash
# Create SOS (authenticated)
curl -X POST http://localhost:3000/api/sos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"Medical","note":"Person injured near market","latitude":23.8223,"longitude":90.3654}'

# List SOS alerts
curl "http://localhost:3000/api/sos?limit=10"

# Update SOS status (admin only)
curl -X PATCH http://localhost:3000/api/sos/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"dispatched"}'
```

### Incidents (admin-managed)

```bash
# List incidents (public)
curl "http://localhost:3000/api/incidents?limit=10"

# Create incident (admin only)
curl -X POST http://localhost:3000/api/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"Flooded section near Road 7","category":"Flood","severity":"High","description":"Standing water has affected the roadside and pedestrian access.","status":"Response started","accent":"#D9485F"}'

# Update incident (admin only)
curl -X PATCH http://localhost:3000/api/incidents/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"Resolved"}'
```

### Resources (admin-managed)

```bash
# List resources (public)
curl "http://localhost:3000/api/resources?wardId=6"

# Create resource (admin only)
curl -X POST http://localhost:3000/api/resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Community Ambulance","category":"Ambulance","contactInfo":"999 / 01700 112233","address":"Ward Office, Road 4"}'
```

### Notices (admin-managed)

```bash
# List notices (public)
curl "http://localhost:3000/api/notices?wardId=6"

# Create notice (admin only)
curl -X POST http://localhost:3000/api/notices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"title":"Waterlogging near Road 7","body":"Please avoid Road 7 between the market and community school while response teams clear standing water.","category":"Emergency Alert"}'
```

### Notifications (user-scoped)

```bash
# List my notifications
curl http://localhost:3000/api/notifications \
  -H "Authorization: Bearer $TOKEN"

# List unread only
curl "http://localhost:3000/api/notifications?unreadOnly=true" \
  -H "Authorization: Bearer $TOKEN"

# Mark as read
curl -X PATCH http://localhost:3000/api/notifications/1/read \
  -H "Authorization: Bearer $TOKEN"

# Mark all as read
curl -X PATCH http://localhost:3000/api/notifications/read-all \
  -H "Authorization: Bearer $TOKEN"
```

### Volunteers

```bash
# Submit volunteer interest (authenticated)
curl -X POST http://localhost:3000/api/volunteers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"skillsOrInterest":"First aid, flood response"}'

# List volunteers (admin sees all, user sees own)
curl http://localhost:3000/api/volunteers \
  -H "Authorization: Bearer $TOKEN"

# Update volunteer status (admin only)
curl -X PATCH http://localhost:3000/api/volunteers/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"status":"approved"}'
```

## Making a User Admin

To test admin-only endpoints, set the `isAdmin` flag on a user:

```sql
UPDATE users SET isAdmin = 1 WHERE email = 'test@example.com';
```

Then login again to get a fresh token — the `requireAdmin` middleware checks the `isAdmin` column from the database.
