export type Visibility = 'PUBLIC' | 'PRIVATE';

export interface UserContract {
    id: string;
    email: string;
    displayName: string;
    timezone: string;
    isPublic: boolean;
}

export interface RotaEntryContract {
    id: string;
    userId: string;
    type: 'WORK' | 'FREE';
    startUtc: string;
    endUtc: string;
    note?: string;
}

export interface FreeWindowContract {
    startUtc: string;
    endUtc: string;
    durationMinutes: number;
}

export interface MessageContract {
    id: string;
    conversationId: string;
    senderId: string;
    recipientId: string;
    body: string;
    sentAt: string;
    deliveryState: 'SENT' | 'DELIVERED' | 'READ';
}
