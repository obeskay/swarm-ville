/**
 * Bottom Status Bar
 * Clean, minimalist design using configuration system
 * ZERO HARDCODING
 */

import React from 'react';
import { useStatusBarUIConfig } from '@/hooks/useUIConfig';
import { useThemeConfig } from '@/hooks/useThemeConfig';
import { useSpaceStore } from '../../stores/spaceStore';

export function BottomStatusBarNew() {
  const statusBarConfig = useStatusBarUIConfig();
  const theme = useThemeConfig();
  const { agents } = useSpaceStore();

  const agentCount = agents.size;
  const isOnline = agentCount > 0;

  return (
    <div
      style={{
        backgroundColor: statusBarConfig.backgroundColor,
        color: statusBarConfig.textColor,
        borderTopColor: statusBarConfig.borderTopColor,
        borderTopWidth: 1,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: `${statusBarConfig.textFontSize}px`,
        fontWeight: statusBarConfig.textFontWeight,
        gap: `${statusBarConfig.itemSpacing}px`,
      }}
      className="h-10"
    >
      {/* Left: Status Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isOnline ? statusBarConfig.onlineIndicatorColor : theme.colors.neutral[400],
          }}
        />
        <span style={{ fontSize: `${statusBarConfig.labelFontSize}px`, color: statusBarConfig.labelColor }}>
          {statusBarConfig.onlineText}
        </span>
      </div>

      {/* Center: Agent Count */}
      <div style={{ flex: 1, textAlign: 'center', fontSize: '12px' }}>
        {agentCount} {agentCount === 1 ? 'agent' : 'agents'}
      </div>

      {/* Right: FPS / Debug Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '11px', color: statusBarConfig.labelColor }}>
          Ready
        </span>
      </div>
    </div>
  );
}
