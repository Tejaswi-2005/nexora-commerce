# NEXORA Commerce

NEXORA Commerce is a full-stack e-commerce platform designed to provide a modern and responsive online shopping experience. It includes product discovery, category-based browsing, cart and wishlist management, checkout, order tracking, and a database-backed REST API.

## Live Demo

**Live Application:**  
https://nexora-commerce--tejaswikunche06.replit.app

## Key Features

- Modern responsive e-commerce interface
- Product browsing and category filtering
- Product search and suggestions
- Shopping cart management
- Wishlist functionality
- Checkout workflow
- Order creation and tracking
- Guest session management
- REST API integration
- PostgreSQL-backed persistent data
- Responsive design for desktop and mobile

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- TanStack React Query

### Backend
- Node.js
- Express.js
- TypeScript
- REST APIs

### Database
- PostgreSQL
- Drizzle ORM

### Development & Deployment
- pnpm
- Git & GitHub
- Replit

## Project Structure

    NEXORA-Commerce/
    ├── artifacts/
    │   ├── nexora/          # React frontend
    │   └── api-server/      # Backend API
    ├── lib/
    │   ├── api-client-react/
    │   └── db/
    ├── attached_assets/
    ├── package.json
    └── pnpm-workspace.yaml

## Running Locally

### Prerequisites

Make sure you have installed:

- Node.js
- pnpm
- Git

### Install dependencies

    pnpm install

### Start the frontend

Navigate to:

    artifacts/nexora

Set the required environment variables and start the development server.

On Windows CMD:

    set PORT=5173
    set BASE_PATH=/
    pnpm run dev

Then open:

    http://localhost:5173

## API Configuration

The frontend uses the shared `@workspace/api-client-react` package for communicating with the backend API.

API requests are handled through a reusable custom fetch client supporting base URL configuration, session identification, response parsing, and API error handling.

## Future Improvements

- Secure user authentication and authorization
- Payment gateway integration
- Admin dashboard
- Product recommendation system
- Inventory management
- Docker-based deployment
- Cloud deployment and CI/CD pipeline

## Author

**Tejaswi Kunche**

GitHub: https://github.com/Tejaswi-2005