/**
 * Helpers for reading the error payloads returned by Supabase Edge Functions.
 *
 * `supabase.functions.invoke()` rejects with a `FunctionsHttpError` whose `message` is
 * always the generic "Edge Function returned a non-2xx status code". The actionable
 * message our functions send lives in the response body, which is only reachable
 * through the (untyped) `context` property. Without unwrapping it, every failure
 * looks identical to the user.
 */

/** Machine-readable codes returned by our own edge functions. */
export const EDGE_ERROR_CODES = {
  emailAlreadyRegistered: 'email_already_registered',
} as const;

export interface EdgeFunctionFailure {
  /** HTTP status from the function, or null when no response was received. */
  status: number | null;
  /** Code set by our functions, when the body included one. */
  code: string | null;
  /** Best available human-readable message. */
  message: string;
  /** Supplementary explanation, when the body included one. */
  details: string | null;
  /**
   * True when the function could not be reached at all — a network failure or a
   * function that is not deployed. Callers use this to decide whether falling back
   * to an alternative code path is appropriate.
   */
  unreachable: boolean;
}

const GENERIC_MESSAGE = 'The server rejected the request.';

/**
 * `context` is typed as `any` by functions-js and is only a `Response` for HTTP
 * errors, so verify the shape before touching it.
 */
const isResponseLike = (value: unknown): value is Response =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Response).status === 'number' &&
  typeof (value as Response).json === 'function';

const readBody = async (response: Response): Promise<Record<string, unknown> | null> => {
  // Clone so the caller keeps an unconsumed body, and tolerate non-JSON payloads
  // (gateway timeouts and platform errors return HTML or plain text).
  try {
    return await response.clone().json();
  } catch {
    return null;
  }
};

const asString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null;

/**
 * Normalizes an error thrown by `functions.invoke` into a structured failure.
 */
export const parseEdgeFunctionError = async (error: unknown): Promise<EdgeFunctionFailure> => {
  const context = (error as { context?: unknown } | null | undefined)?.context;

  if (!isResponseLike(context)) {
    // No HTTP response at all: the request never reached the function.
    return {
      status: null,
      code: null,
      message: asString((error as Error | null)?.message) ?? GENERIC_MESSAGE,
      details: null,
      unreachable: true,
    };
  }

  const body = await readBody(context);

  return {
    status: context.status,
    code: asString(body?.code),
    message: asString(body?.error) ?? asString(body?.message) ?? GENERIC_MESSAGE,
    details: asString(body?.details),
    // A 404 means the function is not deployed, which is a deployment problem
    // rather than a rejection of this particular request.
    unreachable: context.status === 404,
  };
};
