import type { ActionFunctionArgs } from '@remix-run/cloudflare'; // Changed to type-only import
import { json } from '@remix-run/cloudflare';
import type { GrafxAuthTokenResponse } from '~/types/grafx';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  const { code } = (await request.json()) as { code?: string };

  if (!code) {
    return json({ error: 'Authorization code is missing' }, { status: 400 });
  }

  /*
   * Retrieve Auth0 configuration from environment variables
   * For Cloudflare Workers, context.env is the standard way to access secrets/vars
   * const env = context.cloudflare?.env as any ?? context.env as any; // Cast to any if type for env is not fully defined
   */

  const auth0Domain = process.env.GRAFX_AUTH0_DOMAIN;
  const clientId = process.env.GRAFX_AUTH0_CLIENT_ID;
  const clientSecret = process.env.GRAFX_AUTH0_CLIENT_SECRET;
  const redirectUri = process.env.GRAFX_AUTH0_REDIRECT_URI; // Must match the one used in the initial /authorize call
  const audience = process.env.GRAFX_AUTH0_API_AUDIENCE ?? ''; // The API audience for GraFx

  console.log('Auth0 configuration:', {
    auth0Domain,
    clientId,
    clientSecret,
    redirectUri,
    audience,
  });

  if (!auth0Domain || !clientId || !clientSecret || !redirectUri) {
    console.error('Auth0 configuration missing in environment variables for GraFx token exchange.');
    return json({ error: 'Server configuration error for Auth0.' }, { status: 500 });
  }

  const tokenUrl = `https://${auth0Domain}/oauth/token`;

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        audience, // Requesting token for this specific API
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Failed to exchange token and parse error response' }));
      console.error('Auth0 token exchange failed:', response.status, errorData);

      return json(
        { error: 'Failed to exchange authorization code for token.', details: errorData },
        { status: response.status },
      );
    }

    const tokens = (await response.json()) as GrafxAuthTokenResponse;

    /*
     * Securely handle/store tokens as needed.
     * For now, just returning them. The client will then store them via the NanoStore.
     */
    return json(tokens);
  } catch (error) {
    console.error('Error during token exchange:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    return json({ error: 'Token exchange process failed.', details: errorMessage }, { status: 500 });
  }
}
