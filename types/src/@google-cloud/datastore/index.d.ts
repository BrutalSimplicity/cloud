import { GCloud } from '../';

export = Datastore;

declare class Datastore {
    constructor(options: Datastore.DatastoreConfiguration);

    namespace: string;
    projectId: string;

    // crud ops
    save<T>(entity: Datastore.ObjectEntity<T> | Datastore.ObjectEntity<T>[]): Promise<any>;
    save(entity: Datastore.FieldDefinitionEntity | Datastore.FieldDefinitionEntity[]): Promise<any>;
    get<T>(keys: Datastore.Key | Datastore.Key[], options?: Datastore.GetOptions): Promise<T[]>;
    delete(keys: Datastore.Key | Datastore.Key[]): Promise<any>;

    key(options: string | Datastore.KeyOptions): Datastore.Key;

    int(value: number | string): Datastore.Int;
    double(value: number): Datastore.Double;
    geoPoint(coordinates: Datastore.Coordinates): Datastore.GeoPoint;
}

declare namespace Datastore {

    // Datastore configuration options
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

    // Datastore types
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
}
