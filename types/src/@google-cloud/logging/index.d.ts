import { GCloud } from '../';

export = Logging;

declare class Logging {
    constructor(config: GCloud.Configuration);

    log(name: string, options?: Logging.LogCreationOptions): Logging.Log;
    entry(resource: MonitoredResource, data: object | string): Entry;
    entry(data: object | string): Entry;
    getEntries(options?: Logging.GetEntriesOptions): Promise<[Logging.Entry, any]>;

}

export namespace Logging {
    export interface Log {
        alert(entry: Entry): Promise<any>;
        critical(entry: Entry): Promise<any>;
        debug(entry: Entry): Promise<any>;
        delete(entry: Entry): Promise<any>;
        emergency(entry: Entry): Promise<any>;
        entry(resource: MonitoredResource, data: object | string): Entry;
        entry(data: object | string): Entry;
        error(entry: Entry): Promise<any>;
        getEntries(options?: GetEntriesOptions): Promise<[Entry, any]>;
        info(entry: Entry);
        notice(entry: Entry);
        warning(entry: Entry);
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
        labels?: object | object[];
        resource?: object;
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