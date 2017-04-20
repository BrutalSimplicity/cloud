
interface IStorageRepository {
    listFilesAndFolders(idOrPath: string): DownloadCollection;
    downloadFile(idOrPath: string): Promise<Buffer>;
    deleteFile(idOrPath: string): void;
}