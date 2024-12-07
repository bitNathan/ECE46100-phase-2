import request from 'supertest';
import app from '../server';

// Mock OpenAI
jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: jest.fn().mockResolvedValue({
                    choices: [
                        {
                            message: {
                                content: `1. express\n2. passport\n3. stripe\n4. react\n5. tailwindcss`
                            }
                        }
                    ]
                })
            }
        }
    }));
});

// Mock Database
jest.mock('../routes/db', () => ({
    createConnection: jest.fn().mockImplementation(() => ({
        query: jest.fn(),
        end: jest.fn(),
    })),
}));

describe('/recommend endpoint', () => {
    it('should return recommendations for a valid description', async () => {
        const description = 'A web application that needs user authentication, payment integration, and a responsive UI.';
        const response = await request(app)
            .post('/recommend')
            .send({ description })
            .expect('Content-Type', /json/)
            .expect(201);

        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('recommendations');
        expect(typeof response.body.data.recommendations).toBe('string');
        expect(response.body.data.recommendations).toBe(`1. express\n2. passport\n3. stripe\n4. react\n5. tailwindcss`);
    });

    it('should return 400 if no description is provided', async () => {
        const response = await request(app)
            .post('/recommend')
            .send({})
            .expect('Content-Type', /json/)
            .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe('Description is required and should be a string.');
    });

    it('should return 400 if description is not a string', async () => {
        const response = await request(app)
            .post('/recommend')
            .send({ description: 12345 })
            .expect('Content-Type', /json/)
            .expect(400);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe('Description is required and should be a string.');
    });

    it('should return 500 if an unexpected error occurs', async () => {
        // Mock the OpenAI call to throw an error
        const mockOpenAI = jest.requireMock('openai');
        mockOpenAI.mockImplementation(() => ({
            chat: {
                completions: {
                    create: jest.fn().mockRejectedValue(new Error('Mocked API Error')),
                },
            },
        }));

        const description = 'A project description that triggers an error.';
        const response = await request(app)
            .post('/recommend')
            .send({ description })
            .expect('Content-Type', /json/)
            .expect(500);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe('An error occurred while fetching recommendations.');
    });
});
