import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'LLM-AI Job Matching API',
      version: '1.0.0',
      description: `
## AI-powered Recruitment Platform API

This API provides endpoints for:
- **Authentication** — User registration, login, and token refresh
- **AI Analysis** — Candidate evaluation and ranking using Typhoon AI
- **Resume Extraction** — Automated profile extraction from PDF/TXT resumes
- **Shortlist Management** — Save and manage shortlisted candidates

### Authentication
Most endpoints require a Bearer token in the Authorization header.
After login, a refresh token is stored as an httpOnly cookie.
      `,
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token from /api/auth/login',
        },
      },
      schemas: {
        Candidate: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'CAND-001' },
            name: { type: 'string', example: 'John Doe' },
            currentRole: { type: 'string', example: 'Software Engineer' },
            yearsOfExperience: { type: 'integer', example: 5 },
            skills: { type: 'array', items: { type: 'string' }, example: ['React', 'Node.js'] },
            education: { type: 'string', example: "Master's Degree" },
            summary: { type: 'string', example: 'Experienced full-stack developer...' },
          },
          required: ['name'],
        },
        RankedCandidate: {
          allOf: [
            { $ref: '#/components/schemas/Candidate' },
            {
              type: 'object',
              properties: {
                score: { type: 'integer', example: 95 },
                matchedSkills: { type: 'array', items: { type: 'string' } },
                missingSkills: { type: 'array', items: { type: 'string' } },
                pros: { type: 'array', items: { type: 'string' } },
                cons: { type: 'array', items: { type: 'string' } },
              },
            },
          ],
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./routes/*.js'], // Path to the API docs (JSDoc comments in route files)
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
