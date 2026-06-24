import {
  internalErrorResponse,
  parsePositiveInteger,
} from "@/app/api/_shared/util";
import {
  RESPONSE_CODE,
  ResponseFail,
  ResponseSuccess,
} from "@/lib/api-response";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export type Pagination = {
  page: number;
  pageSize: number;
};

export async function handlePaginatedList<T>(
  request: Request,
  query: (pagination: Pagination) => Promise<T>
): Promise<Response> {
  try {
    const searchParams = new URL(request.url).searchParams;
    const rawPage = searchParams.get("page");
    const rawPageSize = searchParams.get("pageSize");
    const page = rawPage ? parsePositiveInteger(rawPage) : 1;
    const parsedPageSize = rawPageSize
      ? parsePositiveInteger(rawPageSize)
      : DEFAULT_PAGE_SIZE;

    if (!page || !parsedPageSize) {
      return ResponseFail.json(
        RESPONSE_CODE.BAD_REQUEST,
        "分页参数必须是正整数"
      );
    }

    return ResponseSuccess.json(
      await query({
        page,
        pageSize: Math.min(parsedPageSize, MAX_PAGE_SIZE),
      })
    );
  } catch {
    return internalErrorResponse();
  }
}
