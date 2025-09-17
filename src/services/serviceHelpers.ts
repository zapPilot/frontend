export type ServiceCall<T> = () => Promise<T>;

interface ExecuteServiceCallOptions {
  mapError?: (error: unknown) => Error;
}

/**
 * Executes a service call and applies consistent error mapping.
 *
 * Keeps service modules focused on describing their API contract while
 * centralising the repetitive try/catch scaffolding.
 */
export async function executeServiceCall<T>(
  call: ServiceCall<T>,
  options: ExecuteServiceCallOptions = {}
): Promise<T> {
  const { mapError } = options;

  try {
    return await call();
  } catch (error) {
    if (mapError) {
      throw mapError(error);
    }

    throw error;
  }
}
