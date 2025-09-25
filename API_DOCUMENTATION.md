# GreenTrust API Documentation

This document outlines the API endpoints for the GreenTrust backend, designed for frontend developers to integrate with the system.

## Base URL

`/api`

## Authentication

All protected routes require a valid JWT `access_token` in the `Authorization` header as a Bearer token.

`Authorization: Bearer <access_token>`

### Endpoints

#### `POST /api/auth/register`
Registers a new user (farmer or buyer).
- **Request Body:**
  ```json
  {
    "phoneNumber": "string",
    "email": "string",
    "password": "string",
    "name": "string",
    "userType": "farmer" | "buyer",
    "location": {
      "lat": "number",
      "lng": "number",
      "address": "string"
    }
  }
  ```

- **Response:**
  ```json
  {
    "message": "OTP sent to phone number. Please verify to complete registration."
  }
  ```

#### `POST /api/auth/login`
Authenticates a user and returns JWT tokens.
- **Request Body:**
  ```json
  {
    "phoneNumber": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "accessToken": "string",
    "refreshToken": "string",
    "user": {
      "id": "uuid",
      "userType": "farmer" | "buyer",
      "name": "string",
      "email": "string",
      "phoneNumber": "string",
      "isVerified": "boolean"
    }
  }
  ```

#### `POST /api/auth/verify-otp`
Verifies the OTP sent during registration or password reset.
- **Request Body:**
  ```json
  {
    "phoneNumber": "string",
    "otp": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Account verified successfully."
  }
  ```

#### `POST /api/auth/resend-otp`
Resends OTP to the user's registered phone number and email.
- **Request Body:**
  ```json
  {
    "phoneNumber": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "OTP resent to your phone number."
  }
  ```

#### `POST /api/auth/forgot-password`
Initiates the forgot password process by sending an OTP.
- **Request Body:**
  ```json
  {
    "phoneNumber": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "OTP sent to your phone number for password reset."
  }
  ```

#### `POST /api/auth/reset-password`
Resets the user's password using a verified OTP.
- **Request Body:**
  ```json
  {
    "phoneNumber": "string",
    "otp": "string",
    "newPassword": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Password reset successfully."
  }
  ```

#### `POST /api/auth/refresh-token`
Refreshes the access token using a valid refresh token.
- **Request Header:** `Authorization: Bearer <refresh_token>`
- **Response:**
  ```json
  {
    "accessToken": "string",
    "refreshToken": "string"
  }
  ```

#### `POST /api/auth/logout`
Logs out the user by invalidating their refresh token.
- **Requires Authentication**
- **Response:**
  ```json
  {
    "message": "Logged out successfully."
  }
  ```

#### `GET /api/auth/profile`
Retrieves the authenticated user's profile.
- **Requires Authentication**
- **Response:**
  ```json
  {
    "id": "uuid",
    "userType": "farmer" | "buyer",
    "phoneNumber": "string",
    "email": "string",
    "name": "string",
    "location": {
      "lat": "number",
      "lng": "number",
      "address": "string"
    },
    "isVerified": "boolean",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
  ```

#### `GET /api/auth/verified-profile`
Retrieves the authenticated and verified user's profile.
- **Requires Authentication and Verification**
- **Response:** (Same as `GET /api/auth/profile`)

## Farmer Endpoints

These endpoints are accessible only to authenticated users with the `farmer` role.

### Profile Management

#### `GET /api/farmer/profile`
Retrieves the authenticated farmer's extended profile.
- **Requires Authentication (Farmer)**
- **Response:**
  ```json
  {
    "userId": "uuid",
    "farmName": "string",
    "farmSize": "string",
    "primaryCrops": ["string"],
    "certificationLevel": "string",
    "rating": "number",
    "user": {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "phoneNumber": "string",
      "location": {
        "lat": "number",
        "lng": "number",
        "address": "string"
      }
    }
  }
  ```

#### `PUT /api/farmer/profile`
Updates the authenticated farmer's extended profile.
- **Requires Authentication (Farmer)**
- **Request Body:**
  ```json
  {
    "farmName": "string",
    "farmSize": "string",
    "primaryCrops": ["string"],
    "certificationLevel": "string",
    "location": {
      "lat": "number",
      "lng": "number",
      "address": "string"
    }
  }
  ```
- **Response:**
  ```json
  {
    "message": "Farmer profile updated successfully.",
    "farmer": { ...updated farmer profile... }
  }
  ```

#### `GET /api/farmer/dashboard`
Retrieves dashboard data for the authenticated farmer.
- **Requires Authentication (Farmer)**
- **Response:**
  ```json
  {
    "totalBatches": "number",
    "availableBatches": "number",
    "listedBatches": "number",
    "soldBatches": "number",
    "spoiledBatches": "number",
    "recentBatches": [
      {
        "id": "uuid",
        "batchId": "string",
        "cropName": "string",
        "quantity": "number",
        "unit": "string",
        "harvestDate": "date",
        "currentStatus": "string",
        "spoilageRiskLevel": "number"
      }
    ],
    "recentInquiries": [
      {
        "id": "uuid",
        "buyerName": "string",
        "listingTitle": "string",
        "message": "string",
        "status": "string",
        "createdAt": "datetime"
      }
    ]
  }
  ```

#### `POST /api/farmer/rating`
Updates a farmer's rating. This endpoint can be called by buyers.
- **Requires Authentication**
- **Request Body:**
  ```json
  {
    "farmerId": "uuid",
    "rating": "number" // 1-5
  }
  ```
- **Response:**
  ```json
  {
    "message": "Farmer rating updated successfully."
  }
  ```

### Batch Management

#### `GET /api/farmer/batches`
Retrieves all harvest batches for the authenticated farmer.
- **Requires Authentication (Farmer)**
- **Query Parameters:**
  - `status`: Filter by batch status (e.g., `available`, `listed`, `sold`, `spoiled`)
  - `cropTemplateId`: Filter by crop template ID
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "batchId": "string",
      "farmerId": "uuid",
      "cropTemplateId": "uuid",
      "cropName": "string",
      "quantity": "number",
      "unit": "string",
      "harvestDate": "date",
      "storageConditions": "json",
      "currentStatus": "string",
      "spoilageRiskLevel": "number",
      "qrCodeUrl": "string",
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ]
  ```

#### `POST /api/farmer/batches`
Creates a new harvest batch.
- **Requires Authentication (Farmer)**
- **Request Body:**
  ```json
  {
    "cropTemplateId": "uuid",
    "quantity": "number",
    "unit": "string",
    "harvestDate": "date",
    "storageConditions": "json"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Harvest batch created successfully.",
    "batch": { ...new batch details... }
  }
  ```

#### `GET /api/farmer/batches/:id`
Retrieves details for a specific harvest batch.
- **Requires Authentication (Farmer)**
- **URL Parameters:** `id` (UUID of the batch)
- **Response:**
  ```json
  {
    "id": "uuid",
    "batchId": "string",
    "farmerId": "uuid",
    "cropTemplateId": "uuid",
    "cropName": "string",
    "quantity": "number",
    "unit": "string",
    "harvestDate": "date",
    "storageConditions": "json",
    "currentStatus": "string",
    "spoilageRiskLevel": "number",
    "qrCodeUrl": "string",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
  ```

#### `PUT /api/farmer/batches/:id`
Updates details for a specific harvest batch.
- **Requires Authentication (Farmer)**
- **URL Parameters:** `id` (UUID of the batch)
- **Request Body:**
  ```json
  {
    "quantity": "number",
    "unit": "string",
    "harvestDate": "date",
    "storageConditions": "json"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Harvest batch updated successfully.",
    "batch": { ...updated batch details... }
  }
  ```

#### `DELETE /api/farmer/batches/:id`
Deletes a specific harvest batch.
- **Requires Authentication (Farmer)**
- **URL Parameters:** `id` (UUID of the batch)
- **Response:**
  ```json
  {
    "message": "Harvest batch deleted successfully."
  }
  ```

#### `POST /api/farmer/batches/:id/qr-code`
Generates a QR code for a specific harvest batch.
- **Requires Authentication (Farmer)**
- **URL Parameters:** `id` (UUID of the batch)
- **Response:**
  ```json
  {
    "message": "QR code generated successfully.",
    "qrCodeUrl": "string"
  }
  ```

#### `PUT /api/farmer/batches/:id/status`
Updates the status of a specific harvest batch.
- **Requires Authentication (Farmer)**
- **URL Parameters:** `id` (UUID of the batch)
- **Request Body:**
  ```json
  {
    "status": "available" | "listed" | "sold" | "spoiled"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Batch status updated successfully.",
    "batch": { ...updated batch details... }
  }
  ```

### Marketplace Listings (Farmer)

#### `GET /api/farmer/listings`
Retrieves all marketplace listings created by the authenticated farmer.
- **Requires Authentication (Farmer)**
- **Query Parameters:**
  - `isActive`: Filter by listing status (`true` or `false`)
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "batchId": "uuid",
      "cropName": "string",
      "quantity": "number",
      "unit": "string",
      "pricePerUnit": "number",
      "currency": "string",
      "isActive": "boolean",
      "viewsCount": "number",
      "inquiriesCount": "number",
      "listedAt": "datetime"
    }
  ]
  ```

#### `POST /api/farmer/listings`
Creates a new marketplace listing for a harvest batch.
- **Requires Authentication (Farmer)**
- **Request Body:**
  ```json
  {
    "batchId": "uuid",
    "pricePerUnit": "number",
    "currency": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Marketplace listing created successfully.",
    "listing": { ...new listing details... }
  }
  ```

#### `PUT /api/farmer/listings/:id`
Updates an existing marketplace listing.
- **Requires Authentication (Farmer)**
- **URL Parameters:** `id` (UUID of the listing)
- **Request Body:**
  ```json
  {
    "pricePerUnit": "number",
    "currency": "string",
    "isActive": "boolean"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Marketplace listing updated successfully.",
    "listing": { ...updated listing details... }
  }
  ```

### Inquiries (Farmer)

#### `GET /api/inquiries/farmer`
Retrieves all inquiries directed to the authenticated farmer's listings.
- **Requires Authentication (Farmer)**
- **Query Parameters:**
  - `status`: Filter by inquiry status (e.g., `pending`, `responded`, `closed`)
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "buyerId": "uuid",
      "buyerName": "string",
      "listingId": "uuid",
      "listingTitle": "string",
      "message": "string",
      "status": "string",
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ]
  ```

#### `PUT /api/inquiries/:id/respond`
Responds to a specific inquiry.
- **Requires Authentication (Farmer)**
- **URL Parameters:** `id` (UUID of the inquiry)
- **Request Body:**
  ```json
  {
    "responseMessage": "string",
    "status": "responded" | "closed"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Inquiry responded to successfully.",
    "inquiry": { ...updated inquiry details... }
  }
  ```

## Buyer Endpoints

These endpoints are accessible only to authenticated users with the `buyer` role.

### Profile Management

#### `GET /api/buyer/profile`
Retrieves the authenticated buyer's extended profile.
- **Requires Authentication (Buyer)**
- **Response:**
  ```json
  {
    "userId": "uuid",
    "businessName": "string",
    "businessType": "string",
    "buyingCapacity": "string",
    "preferredCrops": ["string"],
    "rating": "number",
    "user": {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "phoneNumber": "string",
      "location": {
        "lat": "number",
        "lng": "number",
        "address": "string"
      }
    }
  }
  ```

#### `PUT /api/buyer/profile`
Updates the authenticated buyer's extended profile.
- **Requires Authentication (Buyer)**
- **Request Body:**
  ```json
  {
    "businessName": "string",
    "businessType": "string",
    "buyingCapacity": "string",
    "preferredCrops": ["string"],
    "location": {
      "lat": "number",
      "lng": "number",
      "address": "string"
    }
  }
  ```
- **Response:**
  ```json
  {
    "message": "Buyer profile updated successfully.",
    "buyer": { ...updated buyer profile... }
  }
  ```

#### `GET /api/buyer/dashboard`
Retrieves dashboard data for the authenticated buyer.
- **Requires Authentication (Buyer)**
- **Response:**
  ```json
  {
    "totalInquiries": "number",
    "pendingInquiries": "number",
    "respondedInquiries": "number",
    "closedInquiries": "number",
    "recentInquiries": [
      {
        "id": "uuid",
        "farmerName": "string",
        "listingTitle": "string",
        "message": "string",
        "status": "string",
        "createdAt": "datetime"
      }
    ],
    "recommendedListings": [
      {
        "id": "uuid",
        "cropName": "string",
        "quantity": "number",
        "unit": "string",
        "pricePerUnit": "number",
        "farmerName": "string",
        "location": {
          "lat": "number",
          "lng": "number",
          "address": "string"
        }
      }
    ]
  }
  ```

### Inquiries (Buyer)

#### `POST /api/marketplace/inquiries`
Creates a new inquiry for a marketplace listing.
- **Requires Authentication (Buyer)**
- **Request Body:**
  ```json
  {
    "listingId": "uuid",
    "message": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Inquiry sent successfully.",
    "inquiry": { ...new inquiry details... }
  }
  ```

#### `GET /api/buyer/inquiries`
Retrieves all inquiries made by the authenticated buyer.
- **Requires Authentication (Buyer)**
- **Query Parameters:**
  - `status`: Filter by inquiry status (e.g., `pending`, `responded`, `closed`)
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "listingId": "uuid",
      "listingTitle": "string",
      "farmerName": "string",
      "message": "string",
      "status": "string",
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ]
  ```

## Marketplace Endpoints (Public)

These endpoints are publicly accessible and do not require authentication.

#### `GET /api/marketplace/listings`
Retrieves all active marketplace listings.
- **Query Parameters:**
  - `cropName`: Filter by crop name
  - `farmerId`: Filter by farmer ID
  - `location`: Filter by location (e.g., `lat,lng,radius_km`)
  - `minPrice`: Minimum price per unit
  - `maxPrice`: Maximum price per unit
  - `sortBy`: Sort order (e.g., `price_asc`, `price_desc`, `date_newest`, `date_oldest`)
  - `page`: Page number for pagination
  - `limit`: Number of listings per page
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "batchId": "uuid",
      "cropName": "string",
      "quantity": "number",
      "unit": "string",
      "pricePerUnit": "number",
      "currency": "string",
      "isActive": "boolean",
      "viewsCount": "number",
      "inquiriesCount": "number",
      "listedAt": "datetime",
      "farmer": {
        "id": "uuid",
        "name": "string",
        "farmName": "string",
        "location": {
          "lat": "number",
          "lng": "number",
          "address": "string"
        },
        "rating": "number"
      }
    }
  ]
  ```

#### `GET /api/marketplace/listings/:id`
Retrieves details for a specific marketplace listing.
- **URL Parameters:** `id` (UUID of the listing)
- **Response:**
  ```json
  {
    "id": "uuid",
    "batchId": "uuid",
    "cropName": "string",
    "category": "string",
    "quantity": "number",
    "unit": "string",
    "pricePerUnit": "number",
    "currency": "string",
    "isActive": "boolean",
    "viewsCount": "number",
    "inquiriesCount": "number",
    "listedAt": "datetime",
    "harvestDate": "date",
    "spoilageRiskLevel": "number",
    "storageRecommendations": "json",
    "farmer": {
      "id": "uuid",
      "name": "string",
      "farmName": "string",
      "location": {
        "lat": "number",
        "lng": "number",
        "address": "string"
      },
      "rating": "number"
    }
  }
  ```

#### `POST /api/marketplace/listings/:id/view`
Increments the view count for a specific marketplace listing.
- **URL Parameters:** `id` (UUID of the listing)
- **Response:**
  ```json
  {
    "message": "View count incremented."
  }
  ```

## Crop Templates Endpoints

#### `GET /api/crop-templates/templates`
Retrieves all available crop templates.
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "name": "string",
      "category": "string",
      "spoilageSensitivity": "number",
      "typicalShelfLifeDays": "number",
      "storageRecommendations": "json"
    }
  ]
  ```

#### `POST /api/crop-templates/templates`
Creates a new crop template.
- **Requires Authentication (Farmer)**
- **Request Body:**
  ```json
  {
    "name": "string",
    "category": "string",
    "spoilageSensitivity": "number",
    "typicalShelfLifeDays": "number",
    "storageRecommendations": "json"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Crop template created successfully.",
    "cropTemplate": { ...new crop template details... }
  }
  ```

## Notification Endpoints

These endpoints are accessible only to authenticated users.

#### `GET /api/notifications`
Retrieves all notifications for the authenticated user.
- **Requires Authentication**
- **Query Parameters:**
  - `read`: Filter by read status (`true` or `false`)
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "string",
      "message": "string",
      "isRead": "boolean",
      "createdAt": "datetime"
    }
  ]
  ```

#### `POST /api/notifications/read`
Marks one or more notifications as read.
- **Requires Authentication**
- **Request Body:**
  ```json
  {
    "notificationIds": ["uuid"]
  }
  ```
- **Response:**
  ```json
  {
    "message": "Notifications marked as read."
  }
  ```

#### `GET /api/notifications/unread-count`
Retrieves the count of unread notifications for the authenticated user.
- **Requires Authentication**
- **Response:**
  ```json
  {
    "unreadCount": "number"
  }
  ```

---

## Backend Flow Overview

The GreenTrust backend follows a modular architecture with distinct layers for routing, controllers, services, and models.

1.  **Request Entry:** All incoming HTTP requests are first handled by `server.js`, which sets up the Express application and applies global middleware (e.g., `errorHandler`).
2.  **Routing:** Requests are then directed to specific route files (`backened/src/routes/*.js`) based on the URL path. These route files define the API endpoints and map them to corresponding controller functions.
3.  **Authentication & Authorization:**
    *   The `authenticateToken` middleware (`backened/src/middleware/auth.js`) verifies JWT access tokens for protected routes.
    *   `validateRefreshToken` handles refresh token validation for `/api/auth/refresh-token`.
    *   `farmerMiddleware` and `buyerMiddleware` (`backened/src/middleware/farmer.js`, `backened/src/middleware/buyer.js`) ensure that only users with the correct role can access role-specific endpoints.
    *   `requireVerification` ensures the user's account is verified.
4.  **Validation:** The `validate` middleware (`backened/src/middleware/validation.js`) uses Joi schemas (`backened/src/middleware/validation.js`) to validate request bodies and query parameters before they reach the controllers, ensuring data integrity and preventing common security vulnerabilities.
5.  **Controller Logic:** Controller functions (`backened/src/controllers/*.js`) receive the validated request, interact with services to perform business logic, and prepare the response. They are responsible for orchestrating the flow of data and handling API-specific concerns.
6.  **Service Layer:** Services (`backened/src/services/*.js`) encapsulate the core business logic. They interact with the database (via models) and external services (e.g., `smsService` for OTPs). This separation keeps controllers lean and business logic reusable.
7.  **Database Interaction (Models):** Models (`backened/src/models/*.js`) define the structure of the data and provide an interface for interacting with the PostgreSQL database (using Sequelize ORM). `backened/src/models/index.js` sets up the Sequelize instance and associations.
8.  **Caching:** `backened/src/cache.js` provides caching mechanisms (likely Redis) to improve performance for frequently accessed data.
9.  **Real-time Communication:** `backened/src/socket.js` handles WebSocket connections for real-time updates, such as live marketplace listings or notifications.
10. **Configuration:** `backened/src/config/*.js` files manage application configurations, including database connection settings (`database.js`) and authentication parameters (`auth.js`).
11. **Utilities:** `backened/src/utils/` contains helper functions and common utilities used across the application.
12. **Error Handling:** The `errorHandler` middleware (`backened/src/middleware/errorHandler.js`) catches and processes errors, sending standardized error responses to the client.

This structured approach ensures maintainability, scalability, and clear separation of concerns, making it easier for frontend developers to understand how data flows and how to interact with the API.
