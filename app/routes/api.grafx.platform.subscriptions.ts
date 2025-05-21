import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import { GRAFX_PLATFORM_API_BASE_URL, type GrafxBasicSubscriptionModel } from '~/types/grafx';

// This route should be a GET loader, not a POST action, as it fetches data.
export async function loader({ request }: ActionFunctionArgs) {
  /*
   * Extract access token from Authorization header or session
   * For simplicity, assuming it's passed in a way the hook will manage,
   * e.g. client-side fetch with Authorization header.
   * If called server-to-server, token needs to be available here.
   * This example assumes the client makes the call with its token.
   */
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return json({ error: 'Access token is missing or invalid' }, { status: 401 });
  }

  const accessToken = authHeader.split(' ')[1];

  const subscriptionsApiUrl = `${GRAFX_PLATFORM_API_BASE_URL}/api/v1/subscriptions`;

  try {
    const response = await fetch(subscriptionsApiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Failed to fetch subscriptions and parse error response' }));
      console.error('GraFx Platform API error fetching subscriptions:', response.status, errorData);

      return json(
        { error: 'Failed to fetch subscriptions from GraFx Platform API.', details: errorData },
        { status: response.status },
      );
    }

    const subscriptions = (await response.json()) as GrafxBasicSubscriptionModel[];

    return json(subscriptions);
  } catch (error) {
    console.error('Error fetching GraFx subscriptions:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    return json(
      { error: 'Process failed while fetching GraFx subscriptions.', details: errorMessage },
      { status: 500 },
    );
  }
}
