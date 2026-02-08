# First User Setup Guide

MakeIt uses invite-only registration. The first user needs a bootstrap invite code to register.

## Quick Start

### 1. Set the Bootstrap Invite Code

Add the environment variable before starting the backend:

```bash
# Option A: Export in terminal
export BOOTSTRAP_INVITE_CODE=my-secret-code

# Option B: Add to docker-compose.yml
environment:
  BOOTSTRAP_INVITE_CODE: my-secret-code
```

### 2. Start the Application

```bash
# Development
cd backend && ./gradlew bootRun

# Or with Docker
docker-compose up -d
```

### 3. Register the First User

Open your browser and navigate to:

```
http://localhost:3000/register?code=my-secret-code
```

Fill in:
- **Display Name**: Your name
- **Email**: Your email address
- **Password**: At least 8 characters

### 4. Invite Other Users

After logging in:

1. Go to **Settings** (gear icon in bottom navigation)
2. Click **Generate Invite Code**
3. Copy the invite link and share it with others

The invite link format is:
```
http://localhost:3000/register?code=<generated-code>
```

## Notes

- Bootstrap code only works when no users exist in the database
- Invite codes expire after 7 days by default
- Each invite code can only be used once
- The bootstrap code is removed from memory after first use (restart required to use again)
