import type { GameProfile, Project, Quest } from "../types";

const definitions = [
  { id: "first-seed", title: "Plant a first seed", description: "Give the village a product idea to grow.", xp: 10, coins: 40, gems: 0 },
  { id: "first-release", title: "Ship a release", description: "Let the swarm carry one product all the way to Ship.", xp: 25, coins: 90, gems: 1 },
  { id: "first-harvest", title: "Harvest the orchard", description: "Collect your first release reward from a ready plot.", xp: 50, coins: 150, gems: 2 },
  { id: "garden-tender", title: "Tend the garden", description: "Water three plots to help your products grow.", xp: 20, coins: 70, gems: 0 },
  { id: "studio-scout", title: "Visit Product Studio", description: "Open a shipped workspace and make the release tangible.", xp: 15, coins: 55, gems: 0 }
] as const;

const dailyDefinitions = () => {
  const now = new Date();
  const key = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((value, index) => index === 0 ? String(value) : String(value).padStart(2, "0")).join("-");
  return [
    { id: `daily-${key}-tender`, title: "Daily: care for two plots", description: "Water or fertilize two product plots today.", xp: 15, coins: 45, gems: 0, completed: false },
    { id: `daily-${key}-harvest`, title: "Daily: bring in a harvest", description: "Harvest one shipped release today.", xp: 20, coins: 65, gems: 1, completed: false }
  ] as const;
};

export const getQuests = (projects: Project[], profile: GameProfile): Quest[] => {
  const claimed = new Set(profile.claimedQuests ?? []);
  const evergreen = definitions.map((definition) => ({
    ...definition,
    completed:
      definition.id === "first-seed" ? projects.length > 0 :
      definition.id === "first-release" ? projects.some((project) => Boolean(project.release)) :
      definition.id === "first-harvest" ? profile.harvests > 0 :
      definition.id === "garden-tender" ? (profile.tended ?? 0) >= 3 :
      (profile.studioVisits ?? 0) > 0,
    claimed: claimed.has(definition.id)
  }));
  const daily = dailyDefinitions().map((definition) => ({
    ...definition,
    completed: definition.id.endsWith("-tender") ? (profile.dailyTended ?? 0) >= 2 : (profile.dailyHarvests ?? 0) > 0,
    claimed: claimed.has(definition.id)
  }));
  return [...evergreen, ...daily];
};
