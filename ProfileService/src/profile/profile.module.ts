import { Module } from "@nestjs/common";
import { ProfileService } from "./service/profile.service";
import { ProfileRepository } from "./repository/profile.repository";
import {ProfileController} from "./controller/profile.contorller";

@Module({
    controllers: [ProfileController],
    providers: [
        ProfileService,
        ProfileRepository,
    ],
    exports: [
        ProfileRepository,
    ],
})
export class ProfileModule {}