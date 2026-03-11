import {Injectable} from "@nestjs/common";
import {InboxRepository} from "../repository/inbox.repository";
import {ProfileRepository} from "../../profile/repository/profile.repository";
import {AuthEvent, AuthEventType} from "@app/contracts/kafka/auth";
import {db} from "../../db";

@Injectable()
export class AuthEventUsecase {

    constructor(
        private readonly inboxRepository: InboxRepository,
        private readonly profileRepository: ProfileRepository,
    ) {}

    async handle(event: AuthEvent) {
        await db.transaction( async (tx) => {

            if (await this.inboxRepository.exists(event.eventId, tx)) return;

            const userId = event.payload.userId;
            const curr = await this.profileRepository.getIdentityVersion(userId, tx);
            const newVersion = event.payload.version;

            if (curr >= newVersion) {
                await this.inboxRepository.save({
                    eventId: event.eventId,
                    version: newVersion,
                    aggregateId: userId,
                    eventType: event.eventType,
                }, tx);
                return;
            }

            switch (event.eventType) {
                case AuthEventType.USER_REGISTERED: {
                    await this.profileRepository.create({
                        userId: userId,
                        login: event.payload.login,
                        name: event.payload.profile.name,
                        surname: event.payload.profile.surname,
                        identityVersion: event.payload.version
                    }, tx);

                    break;
                }

                case AuthEventType.USER_CREDENTIALS_UPDATED: {
                    const changed = event.payload.changed ?? [];

                    if (changed.includes("login")) {
                        await this.profileRepository.update(
                            userId,
                            {
                                login: event.payload.login,
                                identityVersion: event.payload.version
                            },
                            tx
                        );
                    } else {
                        await this.profileRepository.update(
                            userId,
                            {
                                identityVersion: event.payload.version
                            },
                            tx
                        );
                    }

                    break;
                }
            }

            await this.inboxRepository.save({
                eventId: event.eventId,
                version: event.payload.version,
                aggregateId: event.payload.userId,
                eventType: event.eventType,
            }, tx);
        });
    }
}