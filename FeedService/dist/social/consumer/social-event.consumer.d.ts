import { ApplySocialEventUseCase } from "../usecase/apply-social-event.usecase";
export declare class SocialEventConsumer {
    private readonly usecase;
    private readonly log;
    constructor(usecase: ApplySocialEventUseCase);
    consume(raw: Record<string, unknown>): Promise<void>;
}
