import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import type { GrafxListTemplatesResponse, GrafxTemplateSummaryItem } from '~/types/grafx';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Extract search and limit from the request URL
  const url = new URL(request.url);
  const search = url.searchParams.get('search');
  const limit = url.searchParams.get('limit');

  // Renamed environmentDefaultName to environmentTechnicalName to match GrafxBasicEnvironmentModel
  const { environmentTechnicalName, environmentBackOfficeUri } = (await request.json()) as {
    environmentTechnicalName?: string; // Changed from environmentDefaultName
    environmentBackOfficeUri?: string;
  };

  // access token from auth header
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return json({ error: 'Authorization header is missing' }, { status: 401 });
  }

  const accessToken = authHeader.split(' ')[1];

  if (!environmentTechnicalName) {
    // Changed from environmentDefaultName
    return json({ error: 'Environment technical name is missing' }, { status: 400 });
  }

  if (!environmentBackOfficeUri) {
    return json({ error: 'Environment back office URI is missing' }, { status: 400 });
  }

  let hostname: string;

  try {
    hostname = new URL(environmentBackOfficeUri).hostname;
  } catch {
    return json({ error: 'Invalid environment back office URI' }, { status: 400 });
  }

  let templatesApiUrl = `https://${hostname}/grafx/api/v1/environment/${environmentTechnicalName}/templates`; // Changed from environmentDefaultName

  // Append search and limit to the GraFx API URL if they exist
  const grafxApiParams = new URLSearchParams();

  if (search) {
    grafxApiParams.append('search', search);
  }

  if (limit) {
    grafxApiParams.append('limit', limit);
  }

  if (grafxApiParams.toString()) {
    templatesApiUrl += `?${grafxApiParams.toString()}`;
  }

  console.log('GraFx API URL with params:', templatesApiUrl);

  try {
    const response = await fetch(templatesApiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Failed to fetch templates and parse error response' }));
      console.error('GraFx API error fetching templates:', response.status, errorData);

      return json(
        { error: 'Failed to fetch templates from GraFx API.', details: errorData },
        { status: response.status },
      );
    }

    const templatesResponse = (await response.json()) as GrafxListTemplatesResponse;

    // We return only the data array which contains the GrafxTemplateSummaryItem[]
    return json(templatesResponse.data as GrafxTemplateSummaryItem[]);
  } catch (error) {
    console.error('Error fetching GraFx templates:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    return json({ error: 'Process failed while fetching GraFx templates.', details: errorMessage }, { status: 500 });
  }
}
