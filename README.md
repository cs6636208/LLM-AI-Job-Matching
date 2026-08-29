# LLM-AI Job Matching & Candidate Analysis

An advanced, full-stack recruitment platform powered by **Typhoon AI**. This system streamlines the hiring process by analyzing high volumes of resumes against specific job requirements using LLM-driven tournament evaluation.

## Key Features

-   **AI Tournament Matcher:** Efficiently analyzes hundreds of candidates by batching them into "qualifying rounds" to stay within LLM token limits while finding the absolute best matches.
-   **Smart PDF Parsing:** Automated extraction of candidate profiles (skills, experience, education) from uploaded PDF/TXT resumes using AI.
-   **Interactive Dashboard:** Elegant glassmorphism UI for managing requirements, rankings, and side-by-side candidate comparisons.
-   **Shortlist Management:** Save and persist your top picks to a local SQLite database for future review.
-   **Modern Auth:** Secure user registration and login with JWT-based sessions.

## Technology Stack

-   **Frontend:** React (Vite), Lucide-React for iconography, Vanilla CSS for premium styling.
-   **Backend:** Node.js, Express.
-   **Database:** Prisma ORM with PostgreSQL.
-   **AI Engine:** Typhoon AI API (`typhoon-v2.5-30b-a3b-instruct`).

## Public candidate portal

The candidate-facing job board is available at `/jobs` and can be deployed behind the same domain as the HR workspace. It supports public job discovery and submits applications through:

- `GET /api/public/jobs`
- `GET /api/public/jobs/:jobId`
- `POST /api/public/jobs/:jobId/applications`
- `GET /api/applications` (authenticated HR inbox)
- `PUT /api/applications/:id` (authenticated HR status update)

Resume files are stored under `UPLOAD_DIR` with random storage keys and are downloadable only through the authenticated HR endpoint `GET /api/applications/:id/resume`. Docker mounts the `resume_uploads` volume so files survive container restarts. For a multi-instance production deployment, replace this local volume with S3/MinIO object storage and signed URLs.

## Docker

Create a root `.env` with `JWT_SECRET`, `JWT_REFRESH_SECRET`, and optionally `TYPHOON_API_KEY`, then run:

```bash
docker compose up --build
```

The public site and HR workspace are served at `http://localhost:8080`. The API is also exposed at `http://localhost:5000` and the API documentation at `http://localhost:5000/api-docs`.

## Getting Started

### Prerequisites
- Node.js installed.
- OpenTyphoon API Key.

### Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/[your-user]/LLM-AI-Job-Matching.git
    cd LLM-AI-Job-Matching
    ```

2.  **Setup Backend:**
    ```bash
    cd backend
    npm install
    # Create a .env file from backend/.env.example and set DATABASE_URL,
    # JWT_SECRET (32+ chars), JWT_REFRESH_SECRET (32+ chars), and TYPHOON_API_KEY.
    npx prisma generate
    npx prisma migrate deploy
    npx prisma db seed
    npm run dev
    ```

3.  **Setup Frontend:**
    ```bash
    # In a separate terminal
    cd ..
    npm install
    npm run dev
    ```

## How to Use
1.  **Load Data:** Use "Load 100 Mock Resumes" or upload real PDF files.
2.  **Set Job Req:** Enter your detailed job requirements in the sidebar.
3.  **Analyze:** Run the AI Matching to see the Top 5 candidates.
4.  **Compare:** Use "Direct Comparison" to see Pros & Cons side-by-side.
5.  **Shortlist:** Click "Shortlist" to save candidates to your database.

