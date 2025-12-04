# CourseMaster Backend

RESTful API for the CourseMaster Learning Management System. Built with Node.js, Express, and MongoDB.

## 🚀 Installation & Run

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start Development Server:**
    ```bash
    npm run dev
    ```
    Server will start on `http://localhost:5000` (default).

## 🔑 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/coursemaster

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

# Client URL (CORS)
CLIENT_URL=http://localhost:3000

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

```

## 📚 API Documentation

### Authentication (`/api/v1/auth`)
- `POST /register` - Register a new user (Student/Instructor)
- `POST /login` - Login user
- `POST /logout` - Logout user (Clear cookie)
- `GET /me` - Get current user profile
- `PATCH /me` - Update user profile (Name)

### Courses (`/api/v1/courses`)
- `GET /` - List all courses (Supports: `?page=1&limit=10&search=...&category=...&sort=price_asc`)
- `GET /:id` - Get course details
- `POST /` - Create new course (Admin only)
- `PATCH /:id` - Update course (Admin only)
- `DELETE /:id` - Delete course (Admin only)

### Enrollments (`/api/v1/enrollments`)
- `GET /my-courses` - Get logged-in user's enrollments
- `POST /:courseId` - Enroll in a course (Free/Paid)
- `GET /details/:courseId` - Get enrollment progress/details
- `POST /progress` - Mark module as completed
- `POST /quiz` - Submit quiz answers
- `POST /assignment` - Submit assignment URL

### Admin (`/api/v1/admin`)
- `GET /stats` - Dashboard statistics
- `GET /courses/:courseId/enrollments` - List students in a course
- `GET /assignments` - List pending assignments
- `PUT /assignments/:enrollmentId/:submissionId` - Grade assignment

### Payments (`/api/v1/payments`)
- `POST /create-checkout-session` - Init Stripe checkout
- `POST /verify` - Verify payment success
- `POST /webhook` - Stripe webhook handler

## 👤 Admin Access

To access the admin dashboard, use these credentials:
- **Email:** `admin@admin.com`
- **Password:** `admin@admin.com`

> **Note:** Ensure you have seeded the database or manually created this admin user.

## 💳 Testing Payments

Use the following **Stripe Test Card** for enrollment:
- **Card Number:** `4242 4242 4242 4242`
- **Expiry:** Any future date (e.g., 12/25)
- **CVC:** `123`
- **ZIP:** Any valid zip (e.g., 10001)
