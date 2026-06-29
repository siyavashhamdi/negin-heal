import { Field, InputType } from "@nestjs/graphql";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

@InputType()
export class PushSubscriptionKeysGqlInput {
  @Field(() => String, { description: "Push subscription p256dh key" })
  @IsString({ message: "Push subscription p256dh key must be a string" })
  @IsNotEmpty({ message: "Push subscription p256dh key is required" })
  p256dh: string;

  @Field(() => String, { description: "Push subscription auth key" })
  @IsString({ message: "Push subscription auth key must be a string" })
  @IsNotEmpty({ message: "Push subscription auth key is required" })
  auth: string;
}

@InputType()
export class RegisterPushSubscriptionGqlInput {
  @Field(() => String, { description: "Push service endpoint URL" })
  @IsString({ message: "Push subscription endpoint must be a string" })
  @IsNotEmpty({ message: "Push subscription endpoint is required" })
  endpoint: string;

  @Field(() => PushSubscriptionKeysGqlInput, {
    description: "Encryption keys returned by PushManager.subscribe()",
  })
  @ValidateNested()
  @Type(() => PushSubscriptionKeysGqlInput)
  keys: PushSubscriptionKeysGqlInput;

  @Field(() => String, {
    description:
      "Previous push endpoint for this browser, removed before registering the new one",
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: "Previous push subscription endpoint must be a string" })
  replacesEndpoint?: string | null;
}

@InputType()
export class UnregisterPushSubscriptionGqlInput {
  @Field(() => String, { description: "Push service endpoint URL to remove" })
  @IsString({ message: "Push subscription endpoint must be a string" })
  @IsNotEmpty({ message: "Push subscription endpoint is required" })
  endpoint: string;
}
