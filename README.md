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
-   **Database:** Prisma ORM with SQLite (Local).
-   **AI Engine:** Typhoon AI API (`typhoon-v2.5-30b-a3b-instruct`).

## Public candidate portal

The candidate-facing job board is available at `/jobs` and can be deployed behind the same domain as the HR workspace. It supports public job discovery and submits applications through:

- `GET /api/public/jobs`
- `GET /api/public/jobs/:jobId`
- `POST /api/public/jobs/:jobId/applications`
- `GET /api/applications` (authenticated HR inbox)
- `PUT /api/applications/:id` (authenticated HR status update)

Resume files are currently stored as application metadata (`resumeName`). For production, connect the upload flow to S3/MinIO and store only a signed object URL in `resumeUrl`.

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
    # Create a .env file and add:
    # TYPHOON_API_KEY=sk-...
    # JWT_SECRET=your_secret
    npx prisma generate
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

