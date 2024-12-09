const restler = require('restler');
import dotenv from 'dotenv';

dotenv.config();
const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

interface RestlerResponse {
    statusCode: number;
    headers: Record<string, string>;
}

interface RestlerRequest {
    options: {
        data: any;
        headers: Record<string, string>;
    };
}

describe('API Integration Tests', () => {
    beforeAll(() => {
        jest.setTimeout(30000);
    });

    describe('Package Operations', () => {
        it('should create a new package (POST /package)', (done) => {
            const packageBuffer = Buffer.from('fake package data');
            const base64Content = packageBuffer.toString('base64');

            // Match the format from your upload_package.test.ts
            const requestData = {
                metadata: {
                    Name: 'TestPackage',
                    Version: '1.0.0'
                },
                data: {
                    Content: base64Content,
                    JSProgram: `if (process.argv.length === 7) {
                        console.log('Success');
                        process.exit(0);
                    } else {
                        console.log('Failed');
                        process.exit(1);
                    }`,
                    debloat: false
                }
            };

            restler.post(`${BASE_URL}/package`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                data: requestData
            })
            .on('success', function(data: any, response: RestlerResponse) {
                try {
                    console.log('Success response:', data);
                    expect(response.statusCode).toBe(201);
                    expect(data).toHaveProperty('metadata');
                    expect(data.metadata).toHaveProperty('Name');
                    expect(data.metadata).toHaveProperty('Version');
                    expect(data.metadata).toHaveProperty('ID');
                    expect(data).toHaveProperty('data');
                    expect(data.data).toHaveProperty('Content');
                    expect(data.data).toHaveProperty('JSProgram');
                    done();
                } catch (error) {
                    done(error);
                }
            })
            .on('fail', function(this: RestlerRequest, data: any, response: RestlerResponse) {
                console.log('Request URL:', `${BASE_URL}/package`);
                console.log('Request data:', JSON.stringify(requestData, null, 2));
                console.log('Failed response data:', data);
                console.log('Failed status code:', response.statusCode);
                console.log('Failed headers:', response.headers);
                done(new Error(`Failed to create package: ${response.statusCode}`));
            })
            .on('error', function(err: Error) {
                console.error('Request error:', err);
                done(err);
            });
        });
    });

    afterAll(async () => {
        await new Promise<void>((resolve, reject) => {
            restler.del(`${BASE_URL}/reset`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            })
            .on('complete', function(result: any, response: RestlerResponse | undefined) {
                if (!response || response.statusCode === 200) {
                    resolve();
                } else {
                    console.log('Reset complete response:', { result, statusCode: response?.statusCode });
                    reject(new Error(`Reset failed: ${response?.statusCode}`));
                }
            });
        });
    });
});