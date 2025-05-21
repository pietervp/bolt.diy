import type { LoaderFunctionArgs } from '@remix-run/cloudflare'; // Changed to LoaderFunctionArgs
import { json } from '@remix-run/cloudflare';
import { GRAFX_PLATFORM_API_BASE_URL, type GrafxBasicEnvironmentModel } from '~/types/grafx';

export async function loader({ request }: LoaderFunctionArgs) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ error: 'Access token is missing or invalid' }, { status: 401 });
  }

  const accessToken = authHeader.split(' ')[1];

  const url = new URL(request.url);
  const subscriptionId = url.searchParams.get('subscriptionId');

  if (!subscriptionId) {
    return json({ error: 'Subscription ID (GUID) is missing from query parameters' }, { status: 400 });
  }

  /*
   * No longer parsing as int, as it's a GUID string now.
   * The API expects a UUID string for subscriptionId parameter according to swagger.
   */

  const environmentsApiUrl = `${GRAFX_PLATFORM_API_BASE_URL}/api/v1/environments?subscriptionId=${subscriptionId}`;

  try {
    const response = await fetch(environmentsApiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Failed to fetch environments and parse error response' }));
      console.error('GraFx Platform API error fetching environments:', response.status, errorData);

      return json(
        { error: 'Failed to fetch environments from GraFx Platform API.', details: errorData },
        { status: response.status },
      );
    }

    const environments = (await response.json()) as GrafxBasicEnvironmentModel[];

    return json(environments.filter((env) => env.type === 'development'));
  } catch (error) {
    console.error('Error fetching GraFx environments:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    return json({ error: 'Process failed while fetching GraFx environments.', details: errorMessage }, { status: 500 });
  }
}
