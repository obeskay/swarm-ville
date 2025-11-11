/**
 * Right Sidebar - Agents Panel
 * Clean, minimalist design using configuration system
 * ZERO HARDCODING
 */

import React from 'react';
import { useSpaceStore } from '../../stores/spaceStore';
import { useAgentsUIConfig } from '@/hooks/useUIConfig';
import { useThemeConfig } from '@/hooks/useThemeConfig';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';

interface RightSidebarNewProps {
  spaceId: string;
  onAddAgent?: () => void;
}

export function RightSidebarNew({ spaceId, onAddAgent }: RightSidebarNewProps) {
  const { agents } = useSpaceStore();
  const agentsConfig = useAgentsUIConfig();
  const theme = useThemeConfig();

  const agentList = Array.from(agents.values());

  return (
    <div
      style={{
        backgroundColor: agentsConfig.backgroundColor,
        color: theme.colors.text.dark.primary,
        borderLeftColor: theme.colors.border.dark,
        borderLeftWidth: 1,
      }}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div style={{ padding: `${agentsConfig.itemPadding}px`, borderBottomColor: theme.colors.border.dark, borderBottomWidth: 1 }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.text.dark.secondary, textTransform: 'uppercase' }}>
          {agentsConfig.headerText}
        </div>
      </div>

      {/* Agents List */}
      <div style={{ padding: `${agentsConfig.itemPadding}px`, overflowY: 'auto', flex: 1 }}>
        {agentList.length === 0 ? (
          <div style={{ textAlign: 'center', color: theme.colors.text.dark.tertiary, fontSize: '13px', padding: '24px 0' }}>
            {agentsConfig.emptyStateText}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${agentsConfig.itemMarginBottom}px` }}>
            {agentList.slice(0, agentsConfig.maxVisibleItems).map((agent) => (
              <div
                key={agent.id}
                style={{
                  backgroundColor: agentsConfig.itemBackgroundColor,
                  borderColor: agentsConfig.itemBorderColor,
                  borderWidth: 1,
                  borderRadius: `${agentsConfig.itemBorderRadius}px`,
                  padding: `${agentsConfig.itemPadding}px`,
                  minHeight: `${agentsConfig.itemMinHeight}px`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    backgroundColor: agentsConfig.avatarBackgroundColor,
                    color: agentsConfig.avatarTextColor,
                    width: `${agentsConfig.avatarSize}px`,
                    height: `${agentsConfig.avatarSize}px`,
                    borderRadius: agentsConfig.avatarBorderRadius === 'full' ? '50%' : `${agentsConfig.avatarBorderRadius}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: `${agentsConfig.avatarFontSize - 2}px`,
                    flexShrink: 0,
                  }}
                >
                  {agent.name.charAt(0)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: `${agentsConfig.nameFontSize}px`, fontWeight: agentsConfig.nameFontWeight, color: agentsConfig.nameColor, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {agent.name}
                  </div>
                  <div style={{ fontSize: `${agentsConfig.roleFontSize}px`, color: agentsConfig.roleColor }}>
                    {agent.role || 'Agent'}
                  </div>
                </div>

                {/* Status indicator */}
                <div
                  style={{
                    width: `${agentsConfig.statusIndicatorSize}px`,
                    height: `${agentsConfig.statusIndicatorSize}px`,
                    borderRadius: '50%',
                    backgroundColor: agentsConfig.statusOnlineColor,
                    flexShrink: 0,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Agent Button */}
      <div style={{ padding: `${agentsConfig.itemPadding}px`, borderTopColor: theme.colors.border.dark, borderTopWidth: 1 }}>
        <Button
          onClick={onAddAgent}
          style={{
            backgroundColor: agentsConfig.addButtonBackgroundColor,
            color: agentsConfig.addButtonTextColor,
            width: '100%',
            borderRadius: `${agentsConfig.addButtonBorderRadius}px`,
            minHeight: `${agentsConfig.addButtonMinHeight}px`,
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Agent
        </Button>
      </div>
    </div>
  );
}
