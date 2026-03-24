import { ApplyContentEventUseCase } from "../usecase/apply-content-event.usecase";
export declare class ContentEventConsumer {
    private readonly usecase;
    private readonly log;
    constructor(usecase: ApplyContentEventUseCase);
    consume(raw: unknown): Promise<void>;
}
