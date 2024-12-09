// restler.d.ts
declare module 'restler' {
    export interface RestlerResponse {
        statusCode: number;
        headers: { [key: string]: string };
    }

    interface RestlerRequest {
        on(event: 'success', callback: (data: any, response: RestlerResponse) => void): this;
        on(event: 'fail', callback: (data: any, response: RestlerResponse) => void): this;
        on(event: 'error', callback: (err: Error) => void): this;
        on(event: 'timeout', callback: () => void): this;
        on(event: 'complete', callback: (data: any, response: RestlerResponse) => void): this;
    }

    export function put(url: string, options?: {
        data?: any;
        headers?: { [key: string]: string };
    }): RestlerRequest;

    export function post(url: string, options?: {
        data?: any;
        headers?: { [key: string]: string };
    }): RestlerRequest;

    export function del(url: string, options?: {
        headers?: { [key: string]: string };
    }): RestlerRequest;
}