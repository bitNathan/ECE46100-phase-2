declare module 'restler' {
    interface RestlerResponse {
        statusCode: number;
        headers: Record<string, string>;
    }

    interface RestlerRequest {
        on(event: 'success', callback: (data: any, response: RestlerResponse) => void): this;
        on(event: 'fail', callback: (data: any, response: RestlerResponse) => void): this;
        on(event: 'error', callback: (err: Error) => void): this;
        on(event: 'complete', callback: (data: any, response: RestlerResponse) => void): this;
    }

    function put(url: string, options?: any): RestlerRequest;
    function post(url: string, options?: any): RestlerRequest;
    function get(url: string, options?: any): RestlerRequest;
    function del(url: string, options?: any): RestlerRequest;
    function del(url: string, options?: any): RestlerRequest;
}