interface FileSaverInterface {
    (blob: any, text: string): void;
}

declare var saveAs: FileSaverInterface;