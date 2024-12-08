import * as restler from 'restler';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;
let AUTH_TOKEN: string | undefined;

interface AuthenticationRequest {
    User: {
        name: string;
        isAdmin: boolean;
    };
    Secret: {
        password: string;
    };
}

interface PackageMetadata {
    Name: string;
    Version: string;
    ID: string;
}

interface PackageData {
    Content?: string;
    JSProgram?: string;
    URL?: string;
}

interface Package {
    metadata: PackageMetadata;
    data: PackageData;
}

function getAuthHeaders(): { 'X-Authorization'?: string } {
    return AUTH_TOKEN ? { 'X-Authorization': AUTH_TOKEN } : {};
}

describe('API Integration Tests', () => {
    beforeAll(() => {
        jest.setTimeout(30000);
    });

    describe('Authentication', () => {
        it('should authenticate with valid credentials', (done) => {
            console.log('Attempting authentication...');
            const authRequest: AuthenticationRequest = {
                User: {
                    name: 'ece30861defaultadminuser',
                    isAdmin: true
                },
                Secret: {
                    password: 'correcthorsebatterystaple123'
                }
            };

            let request = restler.put(`${BASE_URL}/authenticate`, {
                data: authRequest,
                headers: { 'Content-Type': 'application/json' }
            });

            request.on('success', function(data: any, response: any) {
                try {
                    console.log('Auth successful:', response?.statusCode, data);
                    expect(response?.statusCode).toBe(200);
                    expect(typeof data).toBe('string');
                    AUTH_TOKEN = data;
                    done();
                } catch (error) {
                    done(error);
                }
            });

            request.on('fail', function(data: any, response: any) {
                console.log('Auth failed:', response?.statusCode, data);
                done(new Error(`Authentication failed with status ${response?.statusCode}`));
            });

            request.on('error', function(err: Error) {
                console.error('Auth error:', err);
                done(err);
            });

            request.on('timeout', function(ms: number) {
                console.error('Auth timeout after', ms, 'ms');
                done(new Error('Authentication request timed out'));
            });
        });

        it('should reject invalid credentials', (done) => {
            const invalidAuth: AuthenticationRequest = {
                User: {
                    name: 'invalid',
                    isAdmin: false
                },
                Secret: {
                    password: 'wrong'
                }
            };

            let request = restler.put(`${BASE_URL}/authenticate`, {
                data: invalidAuth,
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            });

            request.on('complete', function(data: any, response: any) {
                try {
                    expect(response?.statusCode).toBe(401);
                    done();
                } catch (error) {
                    console.error('Invalid auth test error:', error);
                    done(error);
                }
            });

            request.on('error', function(err: Error) {
                console.error('Invalid auth test error:', err);
                done(err);
            });

            request.on('timeout', function() {
                done(new Error('Request timed out'));
            });
        });
    });

    describe('Package Operations', () => {
        beforeAll(async () => {
            if (!AUTH_TOKEN) {
                const authRequest = {
                    User: {
                        name: 'ece30861defaultadminuser',
                        isAdmin: true
                    },
                    Secret: {
                        password: 'correcthorsebatterystaple123'
                    }
                };

                return new Promise((resolve, reject) => {
                    let request = restler.put(`${BASE_URL}/authenticate`, {
                        data: authRequest,
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 10000
                    });

                    request.on('success', function(data: any) {
                        AUTH_TOKEN = data;
                        resolve(undefined);
                    });

                    request.on('fail', function(data: any, response: any) {
                        reject(new Error(`Auth failed: ${response?.statusCode}`));
                    });

                    request.on('error', function(err: Error) {
                        reject(err);
                    });

                    request.on('timeout', function() {
                        reject(new Error('Auth timed out'));
                    });
                });
            }
        });

        it('should create a new package (POST /package)', (done) => {
            expect(AUTH_TOKEN).toBeDefined();
            const packageData: PackageData = {
                Content: 'UEsDBAoAAAAAAIAAhkAAAAAAAAAAAAAAAAkAAABkb2N1bWVudHMvUEsDBBQACAAIAAAAhkAAAAAAAAAAAAAAAAARAAABZG9jdW1lbnRzL3Rlc3QudHh0RXh0cmEgYnl0ZXMgUEsFBgAAAAACAAIA1gAAAEYAAAAAAA==',
                JSProgram: `
                    if (process.argv.length === 7) {
                        console.log('Success');
                        process.exit(0);
                    } else {
                        console.log('Failed');
                        process.exit(1);
                    }
                `
            };

            let request = restler.post(`${BASE_URL}/package`, {
                data: packageData,
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                timeout: 10000
            });

            request.on('success', function(data: any, response: any) {
                try {
                    expect(response?.statusCode).toBe(201);
                    expect(data).toHaveProperty('metadata');
                    expect(data).toHaveProperty('data');
                    done();
                } catch (error) {
                    done(error);
                }
            });

            request.on('fail', function(data: any, response: any) {
                done(new Error(`Failed to create package: ${response?.statusCode}`));
            });

            request.on('error', function(err: Error) {
                done(err);
            });

            request.on('timeout', function() {
                done(new Error('Request timed out'));
            });
        });

        // Similar pattern for other tests...
    });

    afterAll((done) => {
        if (!AUTH_TOKEN) {
            done();
            return;
        }

        let request = restler.del(`${BASE_URL}/reset`, {
            headers: { ...getAuthHeaders() },
            timeout: 10000
        });

        request.on('complete', function(data: any, response: any) {
            try {
                expect(response?.statusCode).toBe(200);
                done();
            } catch (error) {
                done(error);
            }
        });

        request.on('error', function(err: Error) {
            done(err);
        });

        request.on('timeout', function() {
            done(new Error('Reset request timed out'));
        });
    });
});