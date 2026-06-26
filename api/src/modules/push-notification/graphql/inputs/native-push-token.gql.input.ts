import { Field, InputType, registerEnumType } from "@nestjs/graphql";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

import { NativePushPlatform } from "../../../../enums";

registerEnumType(NativePushPlatform, {
  name: "NativePushPlatform",
  description: "Native mobile push platform",
});

@InputType()
export class RegisterNativePushTokenGqlInput {
  @Field(() => String, { description: "FCM device token" })
  @IsString({ message: "Native push token must be a string" })
  @IsNotEmpty({ message: "Native push token is required" })
  token: string;

  @Field(() => NativePushPlatform, {
    description: "Native platform that issued the push token",
  })
  @IsEnum(NativePushPlatform, {
    message: "Native push platform must be a supported value",
  })
  platform: NativePushPlatform;
}

@InputType()
export class UnregisterNativePushTokenGqlInput {
  @Field(() => String, { description: "FCM device token to remove" })
  @IsString({ message: "Native push token must be a string" })
  @IsNotEmpty({ message: "Native push token is required" })
  token: string;
}
