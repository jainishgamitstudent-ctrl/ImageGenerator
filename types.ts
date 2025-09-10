
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

export interface GeneratedResultGroup {
    id: string;
    outfitImage: string;
    styleImage: string | null;
    views: GeneratedImage[];
    info: string | null;
    videoUrl?: string | null;
    videoError?: string | null;
    isVideoLoading?: boolean;
}

export type Quality = 'Standard' | 'High' | 'Ultra';

export type AnimationType = '360 Turn' | 'Subtle Sway' | 'Catwalk Pose';

export type VideoDuration = 5 | 8 | 10;
