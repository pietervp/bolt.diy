import { json, type MetaFunction, type LoaderFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { useSearchParams, useLoaderData } from '@remix-run/react';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import BackgroundRays from '~/components/ui/BackgroundRays';
import { useState } from 'react';
import { useSettings } from '~/lib/hooks/useSettings';
import { useChatHistory } from '~/lib/persistence';

export const meta: MetaFunction = () => {
  return [
    { title: 'CHILI GraFx Studio' },
    {
      name: 'description',
      content: 'Your visual content, automated and on-brand with CHILI GraFx.',
    },
  ];
};

export const loader: LoaderFunction = async ({ context }) => {
  let showModelSelector = false;

  if (typeof process !== 'undefined') {
    showModelSelector = process.env.FEATURE_FLAG_MODEL_SELECTOR_VISIBLE === 'true';
  } else if (context.env) {
    showModelSelector = (context.env as any).FEATURE_FLAG_MODEL_SELECTOR_VISIBLE === 'true';
  }

  return json({ showModelSelector });
};

/**
 * Landing page component for Bolt
 * Note: Settings functionality should ONLY be accessed through the sidebar menu.
 * Do not add settings button/panel to this landing page as it was intentionally removed
 * to keep the UI clean and consistent with the design system.
 */
export default function Index() {
  const { showModelSelector } = useLoaderData<{ showModelSelector: boolean }>();
  const [searchParams] = useSearchParams();
  const { initialMessages } = useChatHistory();
  const [choice, setChoice] = useState<string | null>(searchParams.get('choice'));
  const { setPromptId } = useSettings();

  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <BackgroundRays />
      <Header />
      {choice ? (
        <ClientOnly fallback={<BaseChat />}>{() => <Chat showModelSelector={showModelSelector} />}</ClientOnly>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 px-4 text-center">
          <h1 className="text-3xl lg:text-6xl font-bold text-bolt-elements-textPrimary mb-4">
            Boost Graphics Production, Shorten Time To Market
          </h1>
          <p className="text-md lg:text-xl mb-8 text-bolt-elements-textSecondary">
            Your visual content, automated and on-brand across all channels with CHILI GraFx, the Graphic engine.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                setChoice('studio-ui');
                setPromptId('studioUiIntegration');

                /*
                 * storeMessageHistory([
                 * {
                 *   id: '1',
                 *   role: 'user',
                 *   content: 'Start an integration by using the Studio UI integration technique'
                 * }
                 * ]);
                 */
                initialMessages.push({
                  id: '1',
                  role: 'system',
                  content: 'Start an integration by using the Studio UI integration technique',
                });
              }}
              className="px-4 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Studio UI Integration
            </button>
            <button
              onClick={() => {
                setChoice('studio-sdk');
                setPromptId('studioSdkIntegration');

                /*
                 * storeMessageHistory([
                 * {
                 *   id: '2',
                 *   role: 'user',
                 *   content: 'Start an integration by using the Studio SDK integration technique'
                 * }
                 * ]);
                 */
                initialMessages.push({
                  id: '2',
                  role: 'system',
                  content: 'Start an integration by using the Studio SDK integration technique',
                });
              }}
              className="px-4 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Studio SDK Integration
            </button>
            <button
              onClick={() => {
                setChoice('real-time-rendering');
                setPromptId('realTimeRenderingIntegration');

                /*
                 *    storeMessageHistory([
                 *   {
                 *     id: '3',
                 *     role: 'user',
                 *     content: 'Start an integration by using the Real Time Rendering integration technique'
                 *   }
                 * ]);
                 */
                initialMessages.push({
                  id: '3',
                  role: 'system',
                  content: 'Start an integration by using the Real Time Rendering integration technique',
                });
              }}
              className="px-4 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Real Time Rendering
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
