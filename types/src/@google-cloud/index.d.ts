export declare namespace GCloud {
    export interface Configuration {
        projectId: string;
        keyFileName?: string;
        email?: string;
        credentials?: Credentials;
        autoRetry?: boolean;
        maxRetries?: number;
    }

    interface Credentials {
        client_email?: string;
        private_key?: string;
    }
}