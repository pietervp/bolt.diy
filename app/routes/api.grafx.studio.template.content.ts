import type { ActionFunctionArgs } from '@remix-run/cloudflare';
import { json } from '@remix-run/cloudflare';
import type { GrafxTemplateContent } from '~/types/grafx';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Renamed environmentDefaultName to environmentTechnicalName
  const { templateId, environmentTechnicalName, environmentBackOfficeUri } = (await request.json()) as {
    templateId?: string;
    environmentTechnicalName?: string; // Changed from environmentDefaultName
    environmentBackOfficeUri?: string;
  };

  // access token from auth header
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return json({ error: 'Authorization header is missing' }, { status: 401 });
  }

  const accessToken = authHeader.split(' ')[1];

  if (!accessToken) {
    return json({ error: 'Access token is missing' }, { status: 401 });
  }

  if (!templateId) {
    return json({ error: 'Template ID is missing' }, { status: 400 });
  }

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

  const metadataUrl = `https://${hostname}/grafx/api/v1/environment/${environmentTechnicalName}/templates/${templateId}`; // Changed
  const contentUrl = `https://${hostname}/grafx/api/v1/environment/${environmentTechnicalName}/templates/${templateId}/download`; // Changed

  try {
    // Fetch metadata
    const metadataResponse = await fetch(metadataUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });

    if (!metadataResponse.ok) {
      const errorData = await metadataResponse
        .json()
        .catch(() => ({ error: 'Failed to fetch template metadata and parse error' }));
      console.error('GraFx API error fetching template metadata:', metadataResponse.status, errorData);

      return json(
        { error: 'Failed to fetch template metadata.', details: errorData },
        { status: metadataResponse.status },
      );
    }

    const metadata = (await metadataResponse.json()) as { name?: string; data?: { name?: string } }; // API might return name at root or in data
    const templateName = metadata.name || metadata.data?.name || 'Unknown Template Name';

    // Fetch content
    const contentResponse = await fetch(contentUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }, // Content might not be JSON, so no Content-Type header
    });

    if (!contentResponse.ok) {
      const errorData = await contentResponse.text().catch(() => 'Failed to fetch template content and parse error');
      console.error('GraFx API error fetching template content:', contentResponse.status, errorData);

      return json(
        { error: 'Failed to fetch template content.', details: errorData },
        { status: contentResponse.status },
      );
    }

    const templateJson = await contentResponse.json();

    const templateContent: GrafxTemplateContent = {
      id: templateId,
      name: templateName,
      json: templateJson,
    };

    return json(templateContent);
  } catch (error) {
    console.error('Error fetching GraFx template content:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    return json(
      { error: 'Process failed while fetching GraFx template content.', details: errorMessage },
      { status: 500 },
    );
  }
}
