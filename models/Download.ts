enum StorageTypes {
    Dropbox,
    Google,
    OneDrive
}

class Download {
    private id: string;
    fileId?: string;
    storage: StorageTypes;
    source?: string;
    category: string;
    path: string;
    createdAt: Date;
    startedAt?: Date;
    completed: boolean;

    constructor(path: string, storage: StorageTypes, category: string = 'Other', filedId?: string, source?: string) {
        this.fileId = filedId;
        this.storage= storage;
        this.source = source;
        this.category = category;
        this.path = path;
        this.createdAt = new Date();
    }
}

class DownloadCollection {
    entries: Download[];
}

export {Download};
export {DownloadCollection};