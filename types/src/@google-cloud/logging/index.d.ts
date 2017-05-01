import { GCloud } from '../';

export = Logging;

declare class Logging {
    constructor(options: GCloud.Configuration);

    log(name: string, options?: Logging.LogCreationOptions): Logging.Log;
    entry(resource: Logging.MonitoredResource, data: any): Logging.Entry;
    entry(data: any): Logging.Entry;
    getEntries(options?: Logging.GetEntriesOptions): Promise<[Logging.Entry[], any]>;

}

declare namespace Logging {
    export interface Log {
        alert(entry: Entry, options?: LogOptions): Promise<any>;
        critical(entry: Entry, options?: LogOptions): Promise<any>;
        debug(entry: Entry, options?: LogOptions): Promise<any>;
        delete(entry: Entry, options?: LogOptions): Promise<any>;
        emergency(entry: Entry, options?: LogOptions): Promise<any>;
        entry(resource: MonitoredResource, data: any | string): Entry;
        entry(data: any | string): Entry;
        error(entry: Entry, options?: LogOptions): Promise<any>;
        getEntries(options?: GetEntriesOptions): Promise<[Entry[], any]>;
        info(entry: Entry, options?: LogOptions);
        notice(entry: Entry, options?: LogOptions);
        warning(entry: Entry, options?: LogOptions);
        write(entry: Entry|Entry[], options?: LogOptions): Promise<any>;
    }

    export interface Entry {
        metadata: MonitoredResource;
        data: any;
    }

    export interface MonitoredResource {
        type: string,
        labels: any;
    }

    export interface LogCreationOptions {
        removeCircular: boolean;
    }

    export interface LogOptions {
        labels?: any | any[];
        resource?: any;
    }

    export interface GetEntriesOptions {
        autoPaginate: boolean;
        filter: string;
        maxApiCalls: number;
        maxResults: number;
        orderBy: 'timestamp' | 'timestamp desc',
        pageSize: number;
        pageToken: string;
    }


}