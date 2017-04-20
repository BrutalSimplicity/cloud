export = Datastore;

declare namespace Datastore {
    export interface Options {
        test: string;
    }
}

declare class Datastore {
    constructor (options: Datastore.Options);
}
