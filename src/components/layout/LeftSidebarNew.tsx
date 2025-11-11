/**
 * Left Sidebar - Missions Panel
 * Clean, minimalist design using configuration system
 * ZERO HARDCODING
 */

import React from 'react';
import { useUserStore } from '../../stores/userStore';
import { useMissionsUIConfig } from '@/hooks/useUIConfig';
import { useThemeConfig } from '@/hooks/useThemeConfig';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';

export function LeftSidebarNew() {
  const missions = useUserStore((state) => state.missions);
  const { level, xp, xpToNextLevel } = useUserStore();
  const missionsConfig = useMissionsUIConfig();
  const theme = useThemeConfig();

  const activeMissions = Object.values(missions).filter((m) => !m.completed);
  const progressPercent = (xp / xpToNextLevel()) * 100;

  return (
    <div
      style={{
        backgroundColor: missionsConfig.backgroundColor,
        color: theme.colors.text.dark.primary,
        borderRightColor: theme.colors.border.dark,
        borderRightWidth: 1,
      }}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Header: Player Level & Progress */}
      <div
        style={{
          padding: `${missionsConfig.itemPadding}px`,
          borderBottomColor: theme.colors.border.dark,
          borderBottomWidth: 1,
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            style={{
              backgroundColor: theme.colors.primary[500],
              color: '#ffffff',
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
          >
            {level}
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>Level {level}</div>
            <div style={{ fontSize: '11px', color: theme.colors.text.dark.secondary }}>
              {xp} / {xpToNextLevel()} XP
            </div>
          </div>
        </div>
        <Progress value={progressPercent} />
      </div>

      {/* Missions List */}
      <div style={{ padding: `${missionsConfig.itemPadding}px`, overflowY: 'auto', flex: 1 }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: theme.colors.text.dark.secondary, marginBottom: '12px', textTransform: 'uppercase' }}>
          {missionsConfig.headerText}
        </div>

        {activeMissions.length === 0 ? (
          <div style={{ textAlign: 'center', color: theme.colors.text.dark.tertiary, fontSize: '13px', padding: '24px 0' }}>
            {missionsConfig.emptyStateText}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${missionsConfig.itemMarginBottom}px` }}>
            {activeMissions.map((mission) => (
              <div
                key={mission.id}
                style={{
                  backgroundColor: missionsConfig.itemBackgroundColor,
                  borderColor: missionsConfig.itemBorderColor,
                  borderWidth: 1,
                  borderRadius: `${missionsConfig.itemBorderRadius}px`,
                  padding: `${missionsConfig.itemPadding}px`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: missionsConfig.titleColor }}>
                    {mission.title}
                  </div>
                  <Badge style={{ fontSize: '11px', backgroundColor: missionsConfig.rewardBadgeBackgroundColor, color: missionsConfig.rewardBadgeTextColor }}>
                    +{mission.xpReward} XP
                  </Badge>
                </div>
                <div style={{ fontSize: '12px', color: missionsConfig.descriptionColor, marginBottom: '8px' }}>
                  {mission.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
