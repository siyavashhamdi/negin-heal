import { Transform } from "class-transformer";
import { Field, ID, InputType } from "@nestjs/graphql";
import { Types } from "mongoose";

import { toObjectId } from "../../../../transforms/object-id.transform";
import { IsObjectId } from "../../../../validators/is-object-id.validator";
import { CourseCreateGqlInput } from "./course-create.gql.input";

@InputType()
export class CourseUpdateGqlInput extends CourseCreateGqlInput {
  @Field(() => ID, { description: "Course ID" })
  @IsObjectId({ message: "Course ID must be a valid MongoDB ObjectId" })
  @Transform(toObjectId)
  id: Types.ObjectId;
}
