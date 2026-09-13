# CivicFix Backend API

Backend REST API for CivicFix application built using Node.js, Express.js, MySQL, and Prisma ORM.

## Project Structure

```
backend/
├── src/
│   ├── config/             # Configuration files (database, env)
│   │   ├── db.js           # Prisma client singleton
│   │   └── env.js          # Environment variables config
│   ├── controllers/        # Route controllers
│   │   └── health.controller.js
│   ├── middleware/         # Custom Express middlewares
│   │   ├── error.middleware.js
│   │   └── notFound.middleware.js
│   ├── routes/             # API routes definition
│   │   ├── health.routes.js
│   │   └── index.js
│   ├── services/           # Business logic layer (Phase 1+)
│   ├── utils/              # Helper utilities and formatters
│   │   └── apiResponse.js
│   ├── validators/         # Request validation logic (Phase 1+)
│   ├── app.js              # Express application configuration
│   └── server.js           # HTTP server bootstrap and lifecycle
├── prisma/
│   └── schema.prisma       # Prisma ORM schema (MySQL)
├── .env                    # Environment variables (git-ignored)
├── .env.example            # Sample environment variables template
├── .gitignore              # Git ignore rules
├── package.json            # Project manifest and dependencies
└── README.md               # Project documentation
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [npm](https://www.npmjs.com/)
- [MySQL](https://www.mysql.com/) server (running locally or remote)

## Installation

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/civicfix_db"
   JWT_SECRET="your_jwt_secret_key_here"
   CLIENT_URL="http://localhost:5173"
   ```

4. Generate the Prisma Client:
   ```bash
   npm run prisma:generate
   ```

## Running the Server

### Development Mode (with hot-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will be available at `http://localhost:5000`.

## Available Endpoints

### Health Check
- **Endpoint**: `GET /api/health`
- **Description**: Verifies that the API service is up and responsive.

### Authentication
- **Endpoint**: `POST /api/auth/register`
  - **Body**: `{ "name": "...", "email": "...", "password": "...", "phone": "...", "address": "..." }`
  - **Description**: Registers a citizen, hashes password, issues JWT token.
- **Endpoint**: `POST /api/auth/login`
  - **Body**: `{ "email": "...", "password": "..." }`
  - **Description**: Authenticates user and returns JWT token and sanitized profile.
- **Endpoint**: `GET /api/auth/me`
  - **Headers**: `Authorization: Bearer <token>`
  - **Description**: Returns profile for currently authenticated user.
- **Endpoint**: `POST /api/auth/logout`
  - **Description**: Standardized endpoint confirming token discard.

### User Management
- **Endpoint**: `GET /api/users`
  - **Headers**: `Authorization: Bearer <token>` (ADMIN or AUTHORITY only)
  - **Query Params**: `role`, `status`, `search`, `page`, `limit`
  - **Description**: Retrieves a paginated list of users.
- **Endpoint**: `GET /api/users/:id`
  - **Headers**: `Authorization: Bearer <token>`
  - **Description**: Retrieves a single user profile by ID without password.
- **Endpoint**: `POST /api/users`
  - **Headers**: `Authorization: Bearer <token>` (ADMIN only)
  - **Body**: `{ "name": "...", "email": "...", "password": "...", "role": "..." }`
  - **Description**: Creates an administrative user with password hashed.

### Complaint Management
- **Endpoint**: `POST /api/complaints`
  - **Headers**: `Authorization: Bearer <token>`
  - **Content-Type**: `multipart/form-data` or `application/json`
  - **Form Fields**: `title`, `description`, `category`, `priority`, `location`, `latitude`, `longitude`
  - **File Field**: `image` or `evidence` (JPEG, PNG, WebP up to 5MB)
  - **Description**: Report a civic issue. Uploads image to storage, validates coordinates, and stores evidence metadata.
- **Endpoint**: `GET /api/complaints`
  - **Headers**: `Authorization: Bearer <token>`
  - **Query Params**: `category`, `status`, `priority`, `search`, `location`, `startDate`, `endDate`, `sortBy`, `order`, `page`, `limit`
  - **Description**: List complaints. Automatically scoped to own complaints for Citizens, assigned tasks for Workers, or all complaints for Authorities/Admins.
- **Endpoint**: `GET /api/complaints/:id`
  - **Headers**: `Authorization: Bearer <token>`
  - **Description**: View full complaint details with citizen and assignment details.
- **Endpoint**: `PUT /api/complaints/:id`
  - **Headers**: `Authorization: Bearer <token>`
  - **Content-Type**: `multipart/form-data` or `application/json`
  - **Form Fields**: `title`, `description`, `location`, `latitude`, `longitude`, `status`, `priority`, `assignedWorkerId`
  - **File Field**: `image` or `evidence` (optional replacement image)
  - **Description**: Update complaint. Citizens can update details while SUBMITTED/UNDER_REVIEW or request status changes validated by the state machine; Authorities can triage/assign/update status.
- **Endpoint**: `POST /api/complaints/:id/feedback`
  - **Headers**: `Authorization: Bearer <token>` (CITIZEN only)
  - **Body**: `{ "rating": 5, "comment": "Excellent repair, road completely smooth." }`
  - **Description**: Citizen submits 1–5 star rating and optional feedback once status is RESOLVED. Automatically advances status to `CLOSED` and notifies Authority/Worker.
- **Endpoint**: `GET /api/complaints/:id/history` & `GET /api/complaints/:id/timeline`
  - **Headers**: `Authorization: Bearer <token>`
  - **Description**: Retrieves full chronological event timeline with actor roles, timestamps, notes, and transition states.
- **Endpoint**: `DELETE /api/complaints/:id`
  - **Headers**: `Authorization: Bearer <token>`
  - **Description**: Delete/cancel complaint. Citizens can delete/cancel their own SUBMITTED complaints; Admins can delete any.

### Authority Workflow
All authority endpoints are protected by `authenticate` and `authorize('AUTHORITY', 'ADMIN')`. Authorities are scoped to their assigned jurisdiction/department unless they are universal officers or system admins.

- **Endpoint**: `GET /api/authority/complaints`
  - **Headers**: `Authorization: Bearer <token>`
  - **Query Params**: `status`, `priority`, `category`, `search`, `assignmentFilter` (`ASSIGNED` | `UNASSIGNED`), `sortBy` (`NEWEST` | `OLDEST` | `PRIORITY_DESC` | `TITLE_AZ`), `page`, `limit`, `authorityDepartment`
  - **Description**: Returns complaints matching the authority's jurisdiction with multi-field search and status/assignment filtering.
- **Endpoint**: `GET /api/authority/complaints/:id`
  - **Headers**: `Authorization: Bearer <token>`
  - **Description**: Retrieves full complaint details, assigned worker/authority information, and the immutable `history` / `timeline` audit trail.
- **Endpoint**: `PATCH /api/authority/complaints/:id/status`
  - **Headers**: `Authorization: Bearer <token>`
  - **Body**: `{ "status": "IN_PROGRESS", "notes": "Technician dispatched to site" }`
  - **Description**: Updates complaint status within authority jurisdiction, sets `resolvedAt` timestamp if `RESOLVED`, and records a new immutable `ComplaintHistory` entry with the officer's actor ID.
- **Endpoint**: `PATCH /api/authority/complaints/:id/priority`
  - **Headers**: `Authorization: Bearer <token>`
  - **Body**: `{ "priority": "CRITICAL", "notes": "High traffic zone, urgent repair required" }`
  - **Description**: Escalates or modifies complaint priority and records audit log.
- **Endpoint**: `POST /api/authority/complaints/:id/assign-worker`
  - **Headers**: `Authorization: Bearer <token>`
  - **Body**: `{ "workerId": "<UUID>", "notes": "Please bring asphalt patching mix" }`
  - **Description**: Validates that target user exists and has the `WORKER` role, sets `assignedWorkerId` and `assignedAuthorityId`, advances status to `ASSIGNED` if in earlier stage, and logs the assignment in the audit timeline.
- **Endpoint**: `GET /api/authority/workers`
  - **Headers**: `Authorization: Bearer <token>`
  - **Query Params**: `department`, `status`
  - **Description**: Returns roster of active workers available for dispatch without exposing passwords.

### Worker Workflow
All worker endpoints are protected by `authenticate` and `authorize('WORKER', 'ADMIN')`. Workers can strictly access and modify tasks specifically assigned to them.

- **Endpoint**: `GET /api/worker/complaints`
  - **Headers**: `Authorization: Bearer <token>`
  - **Query Params**: `statusFilter` (`PENDING_ACCEPTANCE` | `ACTIVE` | `COMPLETED`), `status`, `search`, `page`, `limit`
  - **Description**: Returns complaints assigned specifically to the authenticated worker.
- **Endpoint**: `GET /api/worker/complaints/:id`
  - **Headers**: `Authorization: Bearer <token>`
  - **Description**: Retrieves full task details, assignment status, work updates, and timeline for the worker's assigned complaint.
- **Endpoint**: `PATCH /api/worker/complaints/:id/status`
  - **Headers**: `Authorization: Bearer <token>`
  - **Body**: `{ "status": "ACCEPTED" | "IN_PROGRESS" | "RESOLVED", "notes": "...", "materialsUsed": "..." }`
  - **Description**: Transitions task status. Automatically tracks `acceptedAt`, `startedAt`, or `resolvedAt`/`completedAt` timestamps on both Complaint and Assignment records.
- **Endpoint**: `POST /api/worker/complaints/:id/update`
  - **Headers**: `Authorization: Bearer <token>`
  - **Body**: `{ "notes": "Work progress summary", "materialsUsed": "15L tack primer", "updateType": "PROGRESS" }`
  - **Description**: Adds an intermediate work checkpoint update and logs to audit history.
- **Endpoint**: `POST /api/worker/complaints/:id/evidence`
  - **Headers**: `Authorization: Bearer <token>`
  - **Content-Type**: `multipart/form-data`
  - **Fields**: `image` or `evidence` or `proof` (JPEG, PNG, WebP up to 5MB), `notes`
  - **Description**: Uploads photographic proof of repair. Stores in `/uploads/complaints/`, adds to `resolutionPhotos`, and records a WorkUpdate entry.

### In-App Notifications
All notification endpoints require authentication. Notifications are automatically triggered across lifecycle milestones (assignment, work progress, resolution submission, resolution approval, and feedback).

- **Endpoint**: `GET /api/notifications`
  - **Headers**: `Authorization: Bearer <token>`
  - **Query Params**: `unreadOnly` (`true` | `false`), `page`, `limit`
  - **Description**: Returns paginated notifications for the authenticated user and total unread count.
- **Endpoint**: `PATCH /api/notifications/:id/read`
  - **Headers**: `Authorization: Bearer <token>`
  - **Description**: Marks a specific notification as read.
- **Endpoint**: `PATCH /api/notifications/read-all`
  - **Headers**: `Authorization: Bearer <token>`
  - **Description**: Marks all notifications for authenticated user as read.

### Complaint Lifecycle & State Machine
Valid status transitions are strictly enforced on the server:
- `SUBMITTED` $\rightarrow$ `UNDER_REVIEW`, `ASSIGNED`, `REJECTED`, `CANCELLED`
- `UNDER_REVIEW` $\rightarrow$ `ASSIGNED`, `REJECTED`, `CANCELLED`
- `ASSIGNED` $\rightarrow$ `IN_PROGRESS`, `UNDER_REVIEW`, `RESOLVED`, `CANCELLED`
- `IN_PROGRESS` $\rightarrow$ `RESOLUTION_SUBMITTED`, `RESOLVED`, `ASSIGNED`
- `RESOLUTION_SUBMITTED` $\rightarrow$ `RESOLVED`, `IN_PROGRESS`, `CLOSED`
- `RESOLVED` $\rightarrow$ `CLOSED`, `REOPENED`, `IN_PROGRESS`
- `CLOSED` $\rightarrow$ `REOPENED`
- `REOPENED` $\rightarrow$ `UNDER_REVIEW`, `ASSIGNED`, `IN_PROGRESS`
- `REJECTED` $\rightarrow$ `REOPENED`

### Static Uploads
- **URL**: `http://localhost:5000/uploads/complaints/<filename>`
- **Description**: Statically served evidence image files.



## Available Scripts

- `npm run dev`: Starts the server with Nodemon for development.
- `npm start`: Starts the server with Node.js in production.
- `npm run prisma:generate`: Generates the Prisma Client based on `schema.prisma`.
- `npm run prisma:migrate`: Creates and applies database migrations.
- `npm run prisma:seed`: Seeds the database with initial mock users across all 4 roles.
- `npm run prisma:studio`: Opens Prisma Studio GUI in your browser.

