import { useStore } from '@nanostores/react';
import { useState, useEffect, useCallback } from 'react'; // Added useState, useEffect, useCallback
import { grafxStore } from '~/lib/stores/grafx';
import { useGrafxConnection } from '~/lib/hooks/useGrafxConnection';
import type { GrafxBasicEnvironmentModel } from '~/types/grafx';

// Simple debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }

    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced as (...args: Parameters<F>) => void;
}

export function GrafxSelectionToolbar() {
  const [collapsed, setCollapsed] = useState(false);

  // Directly use store values for display
  const {
    accessToken,
    availableSubscriptions,
    selectedSubscriptionGuid, // Changed from selectedSubscriptionId
    availableEnvironments,
    selectedEnvironment,
    availableTemplates,
    selectedTemplateId,
    isLoading,
    error,
  } = useStore(grafxStore);

  // Helper to get summary
  function getSummary() {
    const sub = availableSubscriptions?.find((s) => s.guid === selectedSubscriptionGuid)?.name || 'No Subscription';
    const env = selectedEnvironment?.name || 'No Environment';
    const tmpl = availableTemplates?.find((t) => t.id === selectedTemplateId)?.name || 'No Template';

    return `${sub} / ${env} / ${tmpl}`;
  }

  // Use methods from the hook for actions
  const {
    selectSubscription,
    selectEnvironment,
    selectTemplate,
    fetchTemplatesBySearch, // This will be added to the hook
  } = useGrafxConnection();

  const [templateSearchTerm, setTemplateSearchTerm] = useState('');

  // Debounced search function
  const debouncedSearchTemplates = useCallback(
    debounce((currentSearchTerm: string) => {
      // The selectedEnvironment from the store is the source of truth for the environment details
      let currentSelectedEnvironment = grafxStore.get().selectedEnvironment;

      if (currentSelectedEnvironment === undefined) {
        currentSelectedEnvironment = null;
      }

      if (fetchTemplatesBySearch) {
        fetchTemplatesBySearch(currentSelectedEnvironment, currentSearchTerm);
      }
    }, 500),

    /*
     * selectedEnvironment from useStore(grafxStore) is reactive and will be the latest.
     * fetchTemplatesBySearch is stable.
     */
    [fetchTemplatesBySearch],
  );

  useEffect(() => {
    /*
     * Initial fetch or fetch when search term changes
     * Only trigger if selectedEnvironment is present, or if search term is cleared to reset
     */
    if (selectedEnvironment || templateSearchTerm === '') {
      debouncedSearchTemplates(templateSearchTerm);
    }
  }, [templateSearchTerm, selectedEnvironment, debouncedSearchTemplates]);

  if (!accessToken) {
    return null; // Don't render if not connected
  }

  const handleSubscriptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subGuid = e.target.value || undefined; // Value is now GUID (string)
    selectSubscription(subGuid);
  };

  const handleEnvironmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const envGuid = e.target.value;
    const environment = availableEnvironments?.find((env) => env.guid === envGuid) || null;
    selectEnvironment(environment as GrafxBasicEnvironmentModel | null); // Cast needed if find returns T | undefined
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value || undefined;
    selectTemplate(templateId);
  };

  const handleTemplateSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTemplateSearchTerm(e.target.value);
  };

  return (
    <div className="grafx-selection-toolbar border border-gray-700 bg-gray-800 text-sm rounded-lg w-full shadow">
      {/* Collapsible Header */}
      <button
        className="w-full flex items-center justify-between px-3 py-2 focus:outline-none group bg-transparent rounded-t-lg"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <div className="font-semibold text-gray-200 flex items-center gap-x-2">
          GraFx Selection
          {collapsed && <span className="truncate text-gray-400 font-normal text-xs ml-2">{getSummary()}</span>}
        </div>
        <span className="ml-2 text-gray-400 group-hover:text-gray-200 transition-transform">
          {collapsed ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M6 8l4 4 4-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M14 12l-4-4-4 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </button>
      {!collapsed && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3 min-h-[48px]">
          {/* Subscription Selector */}
          <div className="flex flex-col gap-y-1 min-w-[180px]">
            <label htmlFor="grafx-subscription-select" className="text-gray-400 font-medium">
              Subscription
            </label>
            <select
              id="grafx-subscription-select"
              value={selectedSubscriptionGuid || ''}
              onChange={handleSubscriptionChange}
              disabled={isLoading || !availableSubscriptions || availableSubscriptions.length === 0}
              className="p-2 border rounded bg-gray-700 text-white border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>
                {isLoading && !availableSubscriptions ? 'Loading Subs...' : 'Select Subscription'}
              </option>
              {availableSubscriptions?.map((sub) => (
                <option key={sub.guid} value={sub.guid}>
                  {sub.name} (GUID: {sub.guid.substring(0, 8)})
                </option>
              ))}
            </select>
          </div>

          {/* Environment Selector */}
          <div className="flex flex-col gap-y-1 min-w-[180px]">
            <label htmlFor="grafx-environment-select" className="text-gray-400 font-medium">
              Environment
            </label>
            <select
              id="grafx-environment-select"
              value={selectedEnvironment?.guid || ''}
              onChange={handleEnvironmentChange}
              disabled={
                isLoading || !selectedSubscriptionGuid || !availableEnvironments || availableEnvironments.length === 0
              }
              className="p-2 border rounded bg-gray-700 text-white border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>
                {isLoading && selectedSubscriptionGuid && !availableEnvironments
                  ? 'Loading Envs...'
                  : 'Select Environment'}
              </option>
              {availableEnvironments?.map((env) => (
                <option key={env.guid} value={env.guid}>
                  {env.name || `Unnamed Env (GUID: ${env.guid.substring(0, 8)})`}
                </option>
              ))}
            </select>
          </div>

          {/* Template Search & Selector */}
          <div className="flex flex-col gap-y-1 min-w-[180px]">
            <label htmlFor="grafx-environment-select" className="text-gray-400 font-medium">
              Template Selection
            </label>{' '}
            <div className="flex flex-row gap-x-2 w-full items-end">
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  {/* Search icon SVG */}
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M20 20l-3.5-3.5" />
                  </svg>
                </span>
                <input
                  id="grafx-template-search"
                  type="text"
                  placeholder="Search templates..."
                  value={templateSearchTerm}
                  onChange={handleTemplateSearchChange}
                  disabled={isLoading || !selectedEnvironment}
                  className="pl-8 pr-2 py-2 border rounded bg-gray-800 text-white border-gray-600 focus:ring-blue-500 focus:border-blue-500 w-full"
                />
              </div>
              <div className="flex flex-col flex-shrink-0 w-[180px]">
                <select
                  id="grafx-template-select"
                  value={selectedTemplateId || ''}
                  onChange={handleTemplateChange}
                  disabled={isLoading || !selectedEnvironment || !availableTemplates}
                  className="p-2 border rounded bg-gray-800 text-white border-gray-600 focus:ring-blue-500 focus:border-blue-500 w-full"
                >
                  <option value="" disabled>
                    {isLoading && selectedEnvironment && !availableTemplates
                      ? 'Loading Templates...'
                      : !selectedEnvironment
                        ? 'Select Environment First'
                        : availableTemplates && availableTemplates.length === 0 && templateSearchTerm
                          ? 'No matches'
                          : availableTemplates && availableTemplates.length === 0
                            ? 'No templates'
                            : 'Select Template'}
                  </option>
                  {availableTemplates?.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
              <p>{isLoading && <span className="text-gray-400 ml-auto">Loading...</span>}</p>
            </div>
          </div>
          {error && <span className="text-red-500">Error: {error}</span>}
        </div>
      )}
    </div>
  );
}
