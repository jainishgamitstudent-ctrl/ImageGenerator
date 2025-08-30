
export interface GeneratedImage {
    src: string;
    alt: string;
    label: string;
}

export enum ViewType {
    FRONT = 'Front view',
    LEFT = 'Left side view',
    RIGHT = 'Right side view',
    BACK = 'Back view'
}
