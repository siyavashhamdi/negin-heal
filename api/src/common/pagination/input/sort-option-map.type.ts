import { SortingOrder } from "./sorting-order.enum";

export type SortOptionMap<TSortFields extends string> = Partial<
  Record<TSortFields, SortingOrder>
>;
