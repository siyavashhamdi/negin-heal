import { Module } from "@nestjs/common";

import { AppSettingsModule } from "../app-settings";
import { EmailService } from "./email.service";

@Module({
  imports: [AppSettingsModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
