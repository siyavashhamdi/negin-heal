import { ApiProperty } from "@nestjs/swagger";

export class BuildVersionsApiResponse {
  @ApiProperty({
    description: "Web app version",
    example: "1.0.3",
    type: String,
  })
  web: string;

  @ApiProperty({
    description: "API version",
    example: "1.0.2",
    type: String,
  })
  api: string;

  @ApiProperty({
    description: "Android app shell version",
    example: "1.0.9",
    type: String,
  })
  android: string;
}
