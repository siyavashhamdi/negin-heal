import { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { useAuth } from "../../contexts/AuthContext";
import { PRODUCT_LIST_QUERY } from "../../graphql/queries/productList.query";
import { USER_PRODUCT_LIST_QUERY } from "../../graphql/queries/userProductList.query";
import {
  buildProductListQueryVariables,
  DEFAULT_PRODUCT_LIST_FILTERS,
  DEFAULT_PRODUCT_LIST_SORT,
  mapProductListRowToRecord,
  type ProductListQuery,
  type ProductListQueryVariables,
  type ProductListRecord,
} from "../Products/product-list.api";

const FEATURED_PRODUCT_COUNT = 3;

type UseLandingFeaturedProductsResult = {
  readonly products: ProductListRecord[];
  readonly loading: boolean;
};

/**
 * Picks the product list query that matches the viewer role so the landing page
 * never triggers forbidden errors for logged-in admins.
 */
export function useLandingFeaturedProducts(): UseLandingFeaturedProductsResult {
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();

  const isEndUser = user?.roles?.includes("END_USER") === true;
  const isSuperAdmin = user?.roles?.includes("SUPER_ADMIN") === true;
  const usePublicList = !isAuthenticated || isEndUser;
  const canFetchProducts = !isAuthLoading && (usePublicList || (isAuthenticated && isSuperAdmin));

  const variables = useMemo(
    () =>
      buildProductListQueryVariables(
        { ...DEFAULT_PRODUCT_LIST_FILTERS, isActive: "ACTIVE" },
        DEFAULT_PRODUCT_LIST_SORT,
        FEATURED_PRODUCT_COUNT,
        null,
        { restrictToFreeOnAndroidApk: usePublicList }
      ),
    [usePublicList]
  );

  const { data, loading } = useQuery<ProductListQuery, ProductListQueryVariables>(
    usePublicList ? USER_PRODUCT_LIST_QUERY : PRODUCT_LIST_QUERY,
    {
      variables,
      fetchPolicy: "cache-first",
      skip: !canFetchProducts,
      errorPolicy: "ignore",
    }
  );

  return {
    products: data?.productList.items.map(mapProductListRowToRecord) ?? [],
    loading: isAuthLoading || (canFetchProducts && loading),
  };
}
