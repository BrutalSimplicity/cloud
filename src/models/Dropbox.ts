import {DownloadCollection} from './Download';

class DropboxCollection extends DownloadCollection {
    cursor: string;
    hasMoreEntries: boolean;
}