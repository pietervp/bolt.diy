import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '@remix-run/react';
import type { LoaderFunctionArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';
import { setGrafxAccessToken, clearGrafxConnection } from '~/lib/stores/grafx';
import type { GrafxAuthTokenResponse } from '~/types/grafx';

// Helper to simulate a loading state or show messages
function AuthCallbackPage({ message, error }: { message?: string; error?: string }) {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      {error ? (
        <>
          <h2>Authentication Error</h2>
          <p style={{ color: 'red' }}>{error}</p>
          <p>
            <a href="/">Go to Homepage</a>
          </p>
        </>
      ) : (
        <>
          <h2>Authenticating with GraFx Studio...</h2>
          <p>{message || 'Please wait while we complete your sign-in.'}</p>
          {/* You could add a spinner here */}
        </>
      )}
    </div>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  // Path for this route
  const currentCallbackPath = '/.auth/login/auth0/callback';

  if (error) {
    console.error(`Auth0 callback error: ${error} - ${errorDescription}`);
    return redirect(`${currentCallbackPath}?client_error=${encodeURIComponent(errorDescription || error)}`);
  }

  if (!code) {
    console.error('Auth0 callback: No authorization code found.');
    return redirect(`${currentCallbackPath}?client_error=${encodeURIComponent('Authorization code missing.')}`);
  }

  return null; // Let the client component handle it
}

export default function GrafxAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Processing authentication...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const clientError = searchParams.get('client_error');

    if (clientError) {
      setError(decodeURIComponent(clientError));
      setMessage('');

      return;
    }

    if (code) {
      setMessage('Authorization code received. Exchanging for token...');
      fetch('/api/grafx/auth-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })
        .then(async (response) => {
          if (!response.ok) {
            let errorMsg = 'Token exchange failed.';

            try {
              const errData = (await response.json()) as { error?: string; message?: string; detail?: string };
              errorMsg =
                errData.error ||
                errData.message ||
                errData.detail ||
                `Token exchange failed with status ${response.status}`;
            } catch {
              errorMsg = `Token exchange failed with status ${response.status} and could not parse error response.`;
            }
            throw new Error(errorMsg);
          }

          return response.json() as Promise<GrafxAuthTokenResponse>;
        })
        .then((tokens) => {
          setMessage('Successfully authenticated! Storing tokens and redirecting...');
          setGrafxAccessToken(tokens.access_token);
          console.log('GraFx Tokens stored:', tokens);
          navigate('/');
        })
        .catch((err) => {
          const errorMessage = err.message || 'An unexpected error occurred during token exchange.';
          console.error('GraFx token exchange error:', err);
          clearGrafxConnection();
          setError(errorMessage);
          setMessage('');
        });
    } else if (!clientError) {
      setError('Authorization code or error parameter is missing from Auth0 redirect.');
      setMessage('');
    }
  }, [searchParams, navigate]);

  return <AuthCallbackPage message={message} error={error || undefined} />;
}
