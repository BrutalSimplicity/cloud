import { GCloud } from '../';

export = Datastore;

declare class Datastore {
    constructor(options: Datastore.DatastoreConfiguration);

    namespace: string;
    projectId: string;
    baseUrl_: string;

    key(options: string | Datastore.KeyOptions): Datastore.Key;

    // crud ops
    save<T>(entity: Datastore.ObjectEntity<T> | Datastore.ObjectEntity<T>[]): Promise<any>;
    save(entity: Datastore.FieldDefinitionEntity | Datastore.FieldDefinitionEntity[]): Promise<any>;
    get<T>(keys: Datastore.Key | Datastore.Key[], options?: Datastore.GetOptions): Promise<[T[], any]>;
    delete(keys: Datastore.Key | Datastore.Key[]): Promise<any>;

    // query
    createQuery(kind: string): Datastore.Query;
    createQuery(namespace: string, kind: string): Datastore.Query;

    // transaction
    transaction(): Datastore.Transaction;

    // types
    int(value: number | string): Datastore.Int;
    double(value: number): Datastore.Double;
    geoPoint(coordinates: Datastore.Coordinates): Datastore.GeoPoint;
}

declare namespace Datastore {
    export const KEY: symbol;

    export interface DatastoreConfiguration extends GCloud.Configuration {
        apiEndpoint?: string;
        namespace?: string;
    }

    export interface GetOptions {
        consistency: 'strong' | 'eventual';
        maxApiCalls: number;
    }

    export interface Coordinates {
        latitude: number,
        longitude: number
    }

    export interface Double {
        value: number;
    }

    export interface Int {
        value: string;
    }

    export interface GeoPoint {
        value: Coordinates;
    }

    export type MethodTypes = "insert" | "update" | "upsert";

    interface BaseEntity {
        key: Key;
        method?: MethodTypes;
    }

    /** Use when passing an object directly to the save method. If you
     * need to exclude indexes or other configuration for individual
     * fields, use the FieldDefinitionEntity.
     */
    export interface ObjectEntity<T> extends BaseEntity {
        data: T;
    }
    
    /** This refers to the Entity object that provides field definition entries,
     * rather than the data object. You must specify the name, value, and whether
     * to exclude from indexes on each field.
     */
    export interface FieldDefinitionEntity extends BaseEntity {
        data: FieldDefinition[];
    }

    export interface FieldDefinition {
        name: string;
        value: any;
        excludeFromIndexes?: boolean;
    }

    export interface KeyOptions {
        path: [string | number ] | [string | number, string | number | Int];
        namespace?: string;
    }

    export interface Key { }

    export class Query {
        namespace: string;
        kinds: string;
        
        filter(property: string, value: any): Query;
        filter(property: string, operator: string, value: any): Query;
        groupBy(properties: string[]): Query;
        limit(n: number): Query;
        offset(n: number): Query;
        order(property: string, options: OrderOptions): Query;
        select(fields: string | string[]): Query;
        run<T>(options?: QueryOptions): Promise<[T, any]>
    }

    export interface QueryOptions {
        consistency: "strong" | "eventual";
    }

    export interface OrderOptions {
        descending: boolean;
    }

    export interface Filter {
        property: string,
        operator?: string,
        value: any;
    }

    export interface QueryResults<T> {
        data: T;
        info: PaginationInfo;
    }

    type PaginationResults = 'MORE_RESULTS_AFTER_LIMIT' | 'MORE_RESULTS_AFTER_CURSOR' | 'NO_MORE_RESULTS';
    export interface PaginationInfo {
        endCursor: string,
        moreResults: PaginationResults
    }

    interface Transaction {
        // crud ops
        save<T>(entity: ObjectEntity<T> | ObjectEntity<T>[]): Promise<any>;
        save(entity: FieldDefinitionEntity | FieldDefinitionEntity[]): Promise<any>;
        get<T>(keys: Key | Key[], options?: GetOptions): Promise<[T[], any]>;
        delete(keys: Key | Key[]): Promise<any>;

        // query
        createQuery(kind: string): Query;
        createQuery(namespace: string, kind: string): Query;
        commit(): Promise<any>;
        rollback(): Promise<any>;
        run(): Promise<[Transaction, any]>;
    }
}

