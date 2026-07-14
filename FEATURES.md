# AI Reminder Web App - Setup Guide

## New Features Implemented

### 1. **Friend System**
- Add friends by email address
- Send and manage friend requests
- Accept/reject friend requests
- View list of friends

**API Endpoints:**
- `POST /api/friends/requests` - Send friend request
- `GET /api/friends/requests` - Get pending requests
- `POST /api/friends/requests/[id]` - Accept/reject request
- `GET /api/friends` - Get friends list

**Frontend:**
- Navigate to `/friends` to manage your friends

---

### 2. **List Sharing with Permissions**
- Share task lists with friends
- Grant granular permissions (can add, can edit, can remove tasks)
- Revoke access anytime

**API Endpoints:**
- `GET /api/lists/[listId]/permissions` - Get current permissions
- `POST /api/lists/[listId]/permissions` - Add/update friend access
- `DELETE /api/lists/[listId]/permissions` - Revoke access

**How to use:**
1. Go to Friends page and add friends
2. Click "Share" on any task list
3. Select friend and toggle permissions
4. Save to share

---

### 3. **Enhanced Task Management**
- Edit task title, description, due date, and priority
- Delete tasks
- Mark tasks as complete/incomplete
- Tasks show priority badges and due dates
- Visual indicators for overdue and due-soon tasks

**API Endpoints:**
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task
- `PATCH /api/tasks/[id]` - Toggle completion

---

### 4. **Email Notifications**
Automatic email reminders for task deadlines.

**Setup Instructions:**

1. **Configure SMTP in `.env`:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@aireminder.com
```

**For Gmail:**
- Enable 2-Factor Authentication
- Create an [App Password](https://myaccount.google.com/apppasswords)
- Use the app password in `SMTP_PASS`

**Features:**
- Pre-deadline alerts (5 minutes before)
- Deadline reached notifications
- Task completion notifications
- Automatic scheduling

---

### 5. **Multi-Language Support**
Greetings in 10 languages with username personalization.

**Supported Languages:**
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Chinese (zh)
- Hindi (hi)
- Japanese (ja)
- Portuguese (pt)
- Korean (ko)
- Arabic (ar)

**How to use:**
1. Update your language preference via API
2. Greeting on dashboard updates automatically
3. Set your username in profile

**API Endpoint:**
- `PUT /api/users/[userId]` - Update language and username

---

### 6. **UI Animations**
Smooth animations throughout the app:
- Fade in/out transitions
- Slide animations
- Scale effects
- Bounce effects
- Task completion animations
- Smooth color transitions

---

## Database Schema Updates

### New Models Added:

**FriendRequest**
- Tracks outgoing and incoming friend requests
- Statuses: pending, accepted, rejected

**Friendship**
- Records confirmed friendships between users
- Prevents duplicate relationships

**ListPermission**
- Controls granular access to shared lists
- Toggles: canAdd, canEdit, canRemove

**EmailNotification**
- Logs all sent notifications
- Tracks scheduled vs sent emails
- Enables notification history

### Updated Models:

**User**
- Added: `username` (optional, for greetings)
- Added: `language` (default: 'en')

**List**
- Added: `updatedAt` timestamp
- Updated cascade behavior

**Task**
- Added: `priority` field (low | medium | high)
- Added database indexes for performance

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
JWT_SECRET=your-secret-key-min-32-chars
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_OAUTH_SUCCESS_REDIRECT=http://localhost:3000/lists

# AI Reports (Groq API)
GROQ_API_KEY=your-groq-api-key

# Local environment
# Copy this file to .env.local when running locally.

# Email Notifications (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@aireminder.com
```

---

## Installation & Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Set up Environment Variables**
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. **Run Database Migration**
```bash
npx prisma db push
npx prisma generate
```

4. **Start Development Server**
```bash
npm run dev
```

5. **Access the App**
- Open http://localhost:3000
- Sign up or log in
- Navigate to `/friends` to add friends
- Start creating and sharing tasks!

---

## API Usage Examples

### Add a Friend
```bash
curl -X POST http://localhost:3000/api/friends/requests \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipientEmail": "friend@example.com"}'
```

### Share a List
```bash
curl -X POST http://localhost:3000/api/lists/LIST_ID/permissions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "friendId": "FRIEND_ID",
    "canAdd": true,
    "canEdit": true,
    "canRemove": false
  }'
```

### Update Task
```bash
curl -X PUT http://localhost:3000/api/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Title",
    "priority": "high",
    "completed": false
  }'
```

---

## Features Roadmap

- [ ] Task templates
- [ ] Recurring tasks
- [ ] Task categories and tags
- [ ] Team workspaces
- [ ] Mobile app
- [ ] Slack integration
- [ ] Calendar view
- [ ] Kanban board view
- [ ] Dark mode

---

## Troubleshooting

**Email not sending?**
- Check SMTP credentials
- Enable "Less secure app access" for Gmail if not using App Password
- Check spam/junk folder
- Review server logs for errors

**Friend requests not appearing?**
- Refresh the page
- Check user email spelling
- Make sure you're not already friends

**Tasks not syncing?**
- Clear browser cache
- Check network tab for API errors
- Verify JWT token is valid

**Database issues?**
```bash
npx prisma db push --force-reset  # Warning: deletes all data
npx prisma generate              # Regenerate Prisma client
```

---

## Support

For issues or feature requests, contact support or check the GitHub issues page.

---

**Last Updated:** December 2024
**Version:** 1.0.0
