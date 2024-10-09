## API Documentation for Node.js Auth System

### Base URL
```
http://localhost:3300/auth
```

### Headers
For all routes except signup, login, and refresh token, include the access token in the `Authorization` header:
```
Authorization: Bearer <your_access_token>
```

---

### 1. **User Signup**

**Endpoint**: `/signup`

**Method**: `POST`

**Description**: Creates a new user and sends an email verification link.

**Request Body**:
```json
{
  "email": "user@example.com",
  "username": "user123",
  "password": "password123",
  "phone": "1234567890"
}
```

**Response** (200 OK):
```json
{
  "message": "Signup successful. Please check your email to verify your account."
}
```

---

### 2. **Verify Email**

**Endpoint**: `/verify/:token`

**Method**: `GET`

**Description**: Verifies the user's email using the token sent via email.

**URL Parameter**:
- `:token` - The email verification token.

**Response** (200 OK):
```json
{
  "message": "Email verified successfully."
}
```

---

### 3. **User Login**

**Endpoint**: `/login`

**Method**: `POST`

**Description**: Authenticates the user and returns access and refresh tokens.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "your_access_token_here",
  "refreshToken": "your_refresh_token_here"
}
```

---

### 4. **Request Password Reset**

**Endpoint**: `/request-password-reset`

**Method**: `POST`

**Description**: Sends a password reset link to the user's email.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset link has been sent to your email."
}
```

---

### 5. **Reset Password**

**Endpoint**: `/reset-password`

**Method**: `POST`

**Description**: Resets the user's password using the token from the reset link.

**Request Body**:
```json
{
  "token": "password_reset_token",
  "newPassword": "newPassword123"
}
```

**Response** (200 OK):
```json
{
  "message": "Password reset successfully."
}
```

---

### 6. **Refresh Token**

**Endpoint**: `/refresh-token`

**Method**: `POST`

**Description**: Generates a new access token using the refresh token.

**Request Body**:
```json
{
  "token": "your_refresh_token_here"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "new_access_token_here"
}
```

---

### 7. **Protected Route Example (Authenticated Request)**

**Endpoint**: `/protected-route`

**Method**: `GET`

**Description**: An example of an authenticated route that requires a valid access token.

**Headers**:
```
Authorization: Bearer <your_access_token>
```

**Response** (200 OK):
```json
{
  "message": "This is a protected resource."
}
```

---

### Error Responses

If a token is expired or invalid, you will get the following error responses:

- **401 Unauthorized**:
  ```json
  {
    "message": "Token is required or invalid"
  }
  ```

- **403 Forbidden** (invalid refresh token):
  ```json
  {
    "message": "Invalid token"
  }
  ```

---

### Authentication Flow

1. **Signup**: User signs up and receives a verification email.
2. **Email Verification**: User verifies their email.
3. **Login**: User logs in and receives an `accessToken` and `refreshToken`.
4. **Access Token Expiry**: When the access token expires (after 15 minutes), the user sends the `refreshToken` to the `/refresh-token` endpoint to get a new `accessToken`.
5. **Password Reset**: If a user forgets their password, they can request a reset link.

---

### Notes
- **Access Token**: Short-lived (15 minutes).
- **Refresh Token**: Long-lived (7 days).
- For improved security, refresh tokens should be stored in an `HttpOnly` cookie or securely in local storage.

---

[go back Index](../Readme.md)