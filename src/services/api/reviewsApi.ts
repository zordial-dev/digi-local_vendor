import { getApiBaseUrl, safeFetch } from './config';
import {
  VendorReviewsResponseData,
  VendorReviewsFetchParams,
  SubmitReviewReplyResponse
} from './types';

// ── Customer Reviews & Ratings API (v2.1.0) ────────────────────

/**
 * Fetch all customer reviews & rating metrics for the vendor store.
 * Endpoints: GET /api/vendor/reviews (fallback: GET /api/vendor/ratings)
 */
export async function fetchVendorReviewsApi(
  params: VendorReviewsFetchParams = {},
  vendorId?: number
): Promise<VendorReviewsResponseData> {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const vId = vendorId || params.vendor_id;

  const queryParts: string[] = [
    `page=${page}`,
    `limit=${limit}`
  ];

  if (params.star !== undefined && params.star >= 1 && params.star <= 5) {
    queryParts.push(`star=${params.star}`);
  }

  if (vId) {
    queryParts.push(`vendor_id=${vId}`);
  }

  const queryString = queryParts.join('&');
  const headers: Record<string, string> = {
    'Accept': 'application/json'
  };

  if (vId) {
    headers['X-Vendor-ID'] = String(vId);
  }

  try {
    // 1. Primary endpoint: GET /api/vendor/reviews
    let { res, data } = await safeFetch(
      `${getApiBaseUrl()}/vendor/reviews?${queryString}`,
      {
        method: 'GET',
        headers
      }
    );

    // 2. Fallback route: GET /api/vendor/ratings
    if (!res.ok && res.status === 404) {
      const fallback = await safeFetch(
        `${getApiBaseUrl()}/vendor/ratings?${queryString}`,
        {
          method: 'GET',
          headers
        }
      );
      if (fallback.res.ok) {
        res = fallback.res;
        data = fallback.data;
      }
    }

    if (res.ok && data) {
      const raw = data.data || data;
      const reviewsList = Array.isArray(raw.reviews)
        ? raw.reviews
        : (Array.isArray(raw.ratings) ? raw.ratings : []);

      const breakdown = raw.metrics?.breakdown || raw.breakdown || {
        "5": 0,
        "4": 0,
        "3": 0,
        "2": 0,
        "1": 0
      };

      const metrics = {
        avg_rating: Number(raw.metrics?.avg_rating ?? raw.avg_rating ?? 0),
        rating_count: Number(raw.metrics?.rating_count ?? raw.rating_count ?? reviewsList.length),
        total_reviews: Number(raw.metrics?.total_reviews ?? raw.total_reviews ?? reviewsList.length),
        breakdown: {
          "5": Number(breakdown["5"] ?? breakdown[5] ?? 0),
          "4": Number(breakdown["4"] ?? breakdown[4] ?? 0),
          "3": Number(breakdown["3"] ?? breakdown[3] ?? 0),
          "2": Number(breakdown["2"] ?? breakdown[2] ?? 0),
          "1": Number(breakdown["1"] ?? breakdown[1] ?? 0),
        }
      };

      const pagination = raw.pagination || {
        total: metrics.total_reviews,
        page: page,
        limit: limit,
        pages: Math.ceil(metrics.total_reviews / limit) || 1
      };

      return {
        vendor_id: raw.vendor_id || vId,
        store_name: raw.store_name || '',
        metrics,
        pagination,
        reviews: reviewsList,
        ratings: reviewsList
      };
    }

    throw new Error(data?.message || data?.error || 'Failed to fetch customer reviews.');
  } catch (err: any) {
    console.error('❌ [FETCH REVIEWS ERROR]:', err.message || err);
    throw err;
  }
}

/**
 * Submit merchant reply to a customer review.
 * Endpoints: POST /api/vendor/ratings/:ratingId/reply (fallback: POST /api/vendor/reviews/:ratingId/reply)
 */
export async function submitVendorReviewReplyApi(
  ratingId: number | string,
  replyText: string,
  vendorId?: number
): Promise<SubmitReviewReplyResponse> {
  const cleanReply = replyText.trim();
  if (!cleanReply) {
    throw new Error('Reply message cannot be empty.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (vendorId) {
    headers['X-Vendor-ID'] = String(vendorId);
  }

  const payload = {
    reply_text: cleanReply
  };

  try {
    // 1. Primary endpoint: POST /api/vendor/ratings/:ratingId/reply
    let { res, data } = await safeFetch(
      `${getApiBaseUrl()}/vendor/ratings/${ratingId}/reply`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      }
    );

    // 2. Fallback route: POST /api/vendor/reviews/:ratingId/reply
    if (!res.ok && res.status === 404) {
      const fallback = await safeFetch(
        `${getApiBaseUrl()}/vendor/reviews/${ratingId}/reply`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        }
      );
      if (fallback.res.ok) {
        res = fallback.res;
        data = fallback.data;
      }
    }

    if (res.ok && data) {
      const raw = data.data || data;
      return {
        rating_id: Number(raw.rating_id || ratingId),
        vendor_id: Number(raw.vendor_id || vendorId || 0),
        reply_text: raw.reply_text || cleanReply,
        replied_at: raw.replied_at || new Date().toISOString()
      };
    }

    throw new Error(data?.message || data?.error || 'Failed to submit reply to customer review.');
  } catch (err: any) {
    console.error('❌ [SUBMIT REVIEW REPLY ERROR]:', err.message || err);
    throw err;
  }
}
