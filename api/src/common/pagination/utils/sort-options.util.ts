import { SortingOrder } from "../input/sorting-order.enum";

type SortOptions<T extends string> = Partial<Record<T, SortingOrder>>;
type FieldMapping<T extends string> = Partial<Record<T, string>>;
type MongoSortOptions = Record<string, 1 | -1>;

export function buildSortOptions<TSortKeys extends string = string>(
  sort: SortOptions<TSortKeys>,
  fieldMapping?: FieldMapping<TSortKeys>,
  defaultSort?: SortOptions<TSortKeys>,
): MongoSortOptions {
  // Use default sort if provided and sort is empty/undefined
  const isSortProvided = sort && Object.keys(sort).length > 0;
  if (!isSortProvided) {
    sort =
      defaultSort ??
      ({ createdAt: SortingOrder.DESC } as SortOptions<TSortKeys>);
  }

  const sortOptions: MongoSortOptions = {};

  for (const [field, order] of Object.entries(sort)) {
    if (!order) {
      continue;
    }

    const orderValue = String(order);
    const dbField = fieldMapping?.[field] || field;
    sortOptions[dbField] = orderValue === SortingOrder.ASC ? 1 : -1;
  }

  return sortOptions;
}
