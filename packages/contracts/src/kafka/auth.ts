export enum AuthEventType {
    USER_REGISTERED = "USER_REGISTERED",
    USER_CREDENTIALS_UPDATED = "USER_CREDENTIALS_UPDATED",
}

export type AuthEventEnvelope<TType extends AuthEventType, TPayload> = {
    eventId: string;
    eventType: TType;
    payload: TPayload;
    createdAt: string;
};

export type UserRegisteredProfilePayload = {
    name: string;
    surname: string;
};

export type UserRegisteredPayload = {
    userId: string;
    login: string;
    email: string;
    createdAt: string;
    profile: UserRegisteredProfilePayload;
    version: number;
};

export type CredentialField = "login" | "email";

export type UserCredentialsUpdatedPayload = {
    userId: string;
    login: string;
    email: string;
    createdAt: string;
    version: number;
    changed: CredentialField[];
};

export type UserRegisteredEvent = AuthEventEnvelope<
    AuthEventType.USER_REGISTERED,
    UserRegisteredPayload
>;

export type UserCredentialsUpdatedEvent = AuthEventEnvelope<
    AuthEventType.USER_CREDENTIALS_UPDATED,
    UserCredentialsUpdatedPayload
>;

export type AuthEvent = UserRegisteredEvent | UserCredentialsUpdatedEvent;

export function isUserRegisteredEvent(e: AuthEvent): e is UserRegisteredEvent {
    return e.eventType === AuthEventType.USER_REGISTERED;
}

export function isUserCredentialsUpdatedEvent(
    e: AuthEvent,
): e is UserCredentialsUpdatedEvent {
    return e.eventType === AuthEventType.USER_CREDENTIALS_UPDATED;
}