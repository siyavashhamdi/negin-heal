import { InputType } from "@nestjs/graphql";

import { CourseWriteGqlInput } from "./course-common.gql.input";

@InputType()
export class CourseCreateGqlInput extends CourseWriteGqlInput {}
