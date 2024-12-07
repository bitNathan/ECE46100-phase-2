import restler from 'restler';
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
    beforeEach(() => {
        jest.setTimeout(10000);
    });

    describe('Authentication', () => {
        it('should authenticate with valid credentials', (done) => {
            const authRequest: AuthenticationRequest = {
                User: {
                    name: 'ece30861defaultadminuser',
                    isAdmin: true
                },
                Secret: {
                    password: 'correcthorsebatterystaple123'
                }
            };

            restler.put(`${BASE_URL}/authenticate`, {
                data: authRequest,
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .on('success', function(data: any, response: any) {
                try {
                    console.log('Auth success response:', response?.statusCode, data);
                    expect(response?.statusCode).toBe(200);
                    expect(typeof data).toBe('string');
                    AUTH_TOKEN = data;
                    done();
                } catch (error) {
                    done(error);
                }
            })
            .on('fail', function(data: any, response: any) {
                console.log('Auth fail response:', response?.statusCode, data);
                done(new Error(`Authentication failed with status ${response?.statusCode}`));
            })
            .on('error', function(err: Error) {
                console.log('Auth error:', err);
                done(err);
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

            restler.put(`${BASE_URL}/authenticate`, {
                data: invalidAuth,
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .on('success', function(data: any, response: any) {
                done(new Error('Expected authentication to fail'));
            })
            .on('fail', function(data: any, response: any) {
                try {
                    expect(response?.statusCode).toBe(401);
                    done();
                } catch (error) {
                    done(error);
                }
            })
            .on('error', function(err: Error) {
                console.log('Invalid auth error:', err);
                done(err);
            });
        });
    });

    describe('Package Operations', () => {
        beforeAll(async () => {
            if (!AUTH_TOKEN) {
                await new Promise<void>((resolve, reject) => {
                    restler.put(`${BASE_URL}/authenticate`, {
                        data: {
                            User: {
                                name: 'ece30861defaultadminuser',
                                isAdmin: true
                            },
                            Secret: {
                                password: 'correcthorsebatterystaple123'
                            }
                        },
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .on('success', function(data: any) {
                        AUTH_TOKEN = data;
                        resolve();
                    })
                    .on('fail', function(data: any, response: any) {
                        reject(new Error(`Authentication failed: ${response?.statusCode}`));
                    })
                    .on('error', function(err: Error) {
                        reject(err);
                    });
                });
            }
        });

        it('should create a new package (POST /package)', (done) => {
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

            restler.post(`${BASE_URL}/package`, {
                data: packageData,
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                }
            })
            .on('success', function(data: any, response: any) {
                try {
                    expect(response?.statusCode).toBe(201);
                    expect(data).toHaveProperty('metadata');
                    expect(data).toHaveProperty('data');
                    done();
                } catch (error) {
                    done(error);
                }
            })
            .on('fail', function(data: any, response: any) {
                console.log('Create package fail:', response?.statusCode, data);
                done(new Error(`Failed to create package: ${response?.statusCode}`));
            })
            .on('error', function(err: Error) {
                console.log('Create package error:', err);
                done(err);
            });
        });

        it('should retrieve package by ID (GET /package/{id})', (done) => {
            // First create a package to get an ID
            const packageData: PackageData = {
                Content: 'UEsDBAoAAAAAAIAAhkAAAAAAAAAAAAAAAAkAAABkb2N1bWVudHMvUEsDBBQACAAIAAAAhkAAAAAAAAAAAAAAAAARAAABZG9jdW1lbnRzL3Rlc3QudHh0RXh0cmEgYnl0ZXMgUEsFBgAAAAACAAIA1gAAAEYAAAAAAA==',
                JSProgram: 'console.log("test")'
            };

            restler.post(`${BASE_URL}/package`, {
                data: packageData,
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                }
            })
            .on('success', function(data: any) {
                const packageId = data.metadata.ID;
                
                restler.get(`${BASE_URL}/package/${packageId}`, {
                    headers: {
                        ...getAuthHeaders()
                    }
                })
                .on('success', function(data: any, response: any) {
                    try {
                        expect(response?.statusCode).toBe(200);
                        expect(data).toHaveProperty('metadata');
                        expect(data).toHaveProperty('data');
                        done();
                    } catch (error) {
                        done(error);
                    }
                })
                .on('fail', function(data: any, response: any) {
                    console.log('Get package fail:', response?.statusCode, data);
                    done(new Error(`Failed to get package: ${response?.statusCode}`));
                })
                .on('error', function(err: Error) {
                    console.log('Get package error:', err);
                    done(err);
                });
            })
            .on('fail', function(data: any, response: any) {
                console.log('Create package fail:', response?.statusCode, data);
                done(new Error(`Failed to create package: ${response?.statusCode}`));
            })
            .on('error', function(err: Error) {
                console.log('Create package error:', err);
                done(err);
            });
        });

        it('should get package rating (GET /package/{id}/rate)', (done) => {
            // First create a package to get an ID
            const packageData: PackageData = {
                Content: 'UEsDBAoAAAAAAIAAhkAAAAAAAAAAAAAAAAkAAABkb2N1bWVudHMvUEsDBBQACAAIAAAAhkAAAAAAAAAAAAAAAAARAAABZG9jdW1lbnRzL3Rlc3QudHh0RXh0cmEgYnl0ZXMgUEsFBgAAAAACAAIA1gAAAEYAAAAAAA==',
                JSProgram: 'console.log("test")'
            };

            restler.post(`${BASE_URL}/package`, {
                data: packageData,
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                }
            })
            .on('success', function(data: any) {
                const packageId = data.metadata.ID;
                
                restler.get(`${BASE_URL}/package/${packageId}/rate`, {
                    headers: {
                        ...getAuthHeaders()
                    }
                })
                .on('success', function(data: any, response: any) {
                    try {
                        expect(response?.statusCode).toBe(200);
                        const requiredFields = [
                            'BusFactor', 'Correctness', 'RampUp', 'ResponsiveMaintainer',
                            'LicenseScore', 'GoodPinningPractice', 'PullRequest', 'NetScore',
                            'BusFactorLatency', 'CorrectnessLatency', 'RampUpLatency',
                            'ResponsiveMaintainerLatency', 'LicenseScoreLatency',
                            'GoodPinningPracticeLatency', 'PullRequestLatency', 'NetScoreLatency'
                        ];
                        requiredFields.forEach(field => {
                            expect(data).toHaveProperty(field);
                        });
                        done();
                    } catch (error) {
                        done(error);
                    }
                })
                .on('fail', function(data: any, response: any) {
                    console.log('Get rating fail:', response?.statusCode, data);
                    done(new Error(`Failed to get rating: ${response?.statusCode}`));
                })
                .on('error', function(err: Error) {
                    console.log('Get rating error:', err);
                    done(err);
                });
            })
            .on('fail', function(data: any, response: any) {
                console.log('Create package fail:', response?.statusCode, data);
                done(new Error(`Failed to create package: ${response?.statusCode}`));
            })
            .on('error', function(err: Error) {
                console.log('Create package error:', err);
                done(err);
            });
        });

        it('should handle package not found (GET /package/{id})', (done) => {
            restler.get(`${BASE_URL}/package/nonexistent-package`, {
                headers: {
                    ...getAuthHeaders()
                }
            })
            .on('success', function() {
                done(new Error('Expected 404 error'));
            })
            .on('fail', function(data: any, response: any) {
                try {
                    expect(response?.statusCode).toBe(404);
                    done();
                } catch (error) {
                    done(error);
                }
            })
            .on('error', function(err: Error) {
                console.log('Get nonexistent package error:', err);
                done(err);
            });
        });
    });

    afterAll((done) => {
        if (AUTH_TOKEN) {
            restler.del(`${BASE_URL}/reset`, {
                headers: {
                    ...getAuthHeaders()
                }
            })
            .on('success', function(data: any, response: any) {
                try {
                    expect(response?.statusCode).toBe(200);
                    done();
                } catch (error) {
                    done(error);
                }
            })
            .on('fail', function(data: any, response: any) {
                console.log('Reset fail:', response?.statusCode, data);
                done(new Error(`Failed to reset: ${response?.statusCode}`));
            })
            .on('error', function(err: Error) {
                console.log('Reset error:', err);
                done(err);
            });
        } else {
            done();
        }
    });
});