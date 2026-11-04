# 📚 BookNook – Server Side

This is the backend API for **BookNook**, an online community library platform. It is built with Express.js and MongoDB to handle book management, borrowing operations, returning books, and communication between the frontend and database.

## ✨ Key Features

- **RESTful API:** Provides structured API endpoints for managing books and borrowing records.
- **Book Management:** Create, retrieve, update, and delete books from the library.
- **Borrowing System:** Allows authenticated users to borrow available books.
- **Return Books:** Handles book returns and updates available copy counts.
- **Availability Management:** Automatically decreases available copies when a book is borrowed and increases them when returned.
- **Duplicate Borrow Prevention:** Prevents users from borrowing the same book multiple times simultaneously.
- **JWT Authentication:** Validates JWT tokens to protect authorized API endpoints.
- **User-Specific Records:** Retrieves borrowing records associated with the authenticated user.
- **MongoDB Integration:** Stores books and borrowing information in MongoDB.

## 🛠️ Technologies Used

- Node.js
- Express.js
- MongoDB
- JavaScript
- JSON Web Token (JWT)
- CORS
- dotenv


## ⚙️ Installation & Setup

Follow these steps to run the backend server locally.

**1. Clone the repository**

```bash
git clone https://github.com/christinapenheiro/booknook-server
```

**2. Navigate to the project directory**

```bash
cd BookNook-server
```

**3. Install dependencies**

```bash
npm install
```

**4. Configure environment variables**

Create a `.env` file in the root directory.

```env
PORT=8000
MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING
JWT_SECRET=YOUR_JWT_SECRET
```

Make sure your environment variable names match those used in your server code.

**5. Start the server**

```bash
npm start
```

For development, if you have configured a development script:

```bash
npm run dev
```

The server will run at:

```text
http://localhost:8000
```

## 🗄️ Database Structure

BookNook uses MongoDB to store application data.

**Books Collection (`books`)**

Stores book information, including:

- Book title
- Author name
- Category
- Book image URL
- Short description
- Available copies
- User information (name and email)
- Date added

**Borrows Collection (`borrows`)**

Stores borrowing information, including:

- Book ID
- Book title
- Book image
- User email
- Borrow date
- Return date

## 🔒 Security & Authentication

- JWT-based token validation for protected API routes.
- Authentication checks before accessing user-specific borrowing records.
- CORS configuration for frontend-backend communication.
- Environment variables for sensitive configuration.
- User-specific data access based on authenticated identity.

## 🌐 Deployment

The backend API is deployed using **Vercel**.

The frontend application communicates with this backend to retrieve and manage library data.

## 👨‍💻 Author

**Developer:** Christina Penheiro

**GitHub:** [https://github.com/christinapenheiro](YOUR_GITHUB_PROFILE_URL)

---

⭐ Developed as the backend for the BookNook Online Community Library project.