import fs from "fs";
import path from "path";

const PUBLIC_DIR = path.resolve("./public/sprites");
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Define the 8 Agent Roles and their visual identity
const ROLES = [
  {
    role: "architect",
    title: "System Architect",
    color: "#a855f7",
    darkColor: "#6b21a8",
    lightColor: "#d8b4fe",
    hat: "wizard",
    accessory: "wand",
    symbol: "⚡"
  },
  {
    role: "executor",
    title: "Lead Developer",
    color: "#22c55e",
    darkColor: "#15803d",
    lightColor: "#86efac",
    hat: "hoodie",
    accessory: "goggles",
    symbol: "💻"
  },
  {
    role: "designer",
    title: "UI/UX Designer",
    color: "#3b82f6",
    darkColor: "#1d4ed8",
    lightColor: "#93c5fd",
    hat: "beret",
    accessory: "palette",
    symbol: "🎨"
  },
  {
    role: "planner",
    title: "Product Planner",
    color: "#f59e0b",
    darkColor: "#b45309",
    lightColor: "#fde68a",
    hat: "crown",
    accessory: "blueprint",
    symbol: "📋"
  },
  {
    role: "critic",
    title: "Code Reviewer",
    color: "#ef4444",
    darkColor: "#b91c1c",
    lightColor: "#fca5a5",
    hat: "visor",
    accessory: "shield",
    symbol: "🔍"
  },
  {
    role: "tester",
    title: "QA Specialist",
    color: "#f97316",
    darkColor: "#c2410c",
    lightColor: "#fdba74",
    hat: "cap",
    accessory: "scanner",
    symbol: "🧪"
  },
  {
    role: "oracle",
    title: "AI Oracle",
    color: "#8b5cf6",
    darkColor: "#5b21b6",
    lightColor: "#c4b5fd",
    hat: "halo",
    accessory: "crystal",
    symbol: "🧠"
  },
  {
    role: "librarian",
    title: "Knowledge Curator",
    color: "#06b6d4",
    darkColor: "#0e7490",
    lightColor: "#67e8f9",
    hat: "glasses",
    accessory: "book",
    symbol: "📚"
  }
];

// Helper to generate character SVG sprite sheet (32x32 per frame, 7 frames = 224x32)
function generateCharacterSVG(roleInfo) {
  const { color, darkColor, lightColor, hat, symbol } = roleInfo;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 224 32" width="224" height="32" shape-rendering="crispEdges">
  <defs>
    <filter id="glow-${roleInfo.role}">
      <feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="${color}" flood-opacity="0.8"/>
    </filter>
  </defs>

  <!-- Frame 0: Idle Down -->
  <g transform="translate(0, 0)">
    <ellipse cx="16" cy="28" rx="8" ry="3" fill="#000000" opacity="0.3"/>
    <rect x="10" y="14" width="12" height="11" rx="2" fill="${color}"/>
    <rect x="12" y="16" width="8" height="7" rx="1" fill="${darkColor}"/>
    <rect x="10" y="24" width="4" height="4" rx="1" fill="#1e293b"/>
    <rect x="18" y="24" width="4" height="4" rx="1" fill="#1e293b"/>
    <circle cx="16" cy="11" r="7" fill="#fde047"/>
    <rect x="13" y="10" width="2" height="3" fill="#0f172a"/>
    <rect x="17" y="10" width="2" height="3" fill="#0f172a"/>
    ${getHeadgear(hat, color, darkColor, lightColor)}
  </g>

  <!-- Frame 1: Walk Down 1 -->
  <g transform="translate(32, 0)">
    <ellipse cx="16" cy="28" rx="8" ry="3" fill="#000000" opacity="0.3"/>
    <rect x="10" y="13" width="12" height="11" rx="2" fill="${color}"/>
    <rect x="12" y="15" width="8" height="7" rx="1" fill="${darkColor}"/>
    <rect x="9" y="23" width="5" height="5" rx="1" fill="#1e293b"/>
    <rect x="18" y="24" width="4" height="3" rx="1" fill="#1e293b"/>
    <circle cx="16" cy="10" r="7" fill="#fde047"/>
    <rect x="13" y="9" width="2" height="3" fill="#0f172a"/>
    <rect x="17" y="9" width="2" height="3" fill="#0f172a"/>
    ${getHeadgear(hat, color, darkColor, lightColor, -1)}
  </g>

  <!-- Frame 2: Walk Down 2 -->
  <g transform="translate(64, 0)">
    <ellipse cx="16" cy="28" rx="8" ry="3" fill="#000000" opacity="0.3"/>
    <rect x="10" y="13" width="12" height="11" rx="2" fill="${color}"/>
    <rect x="12" y="15" width="8" height="7" rx="1" fill="${darkColor}"/>
    <rect x="10" y="24" width="4" height="3" rx="1" fill="#1e293b"/>
    <rect x="18" y="23" width="5" height="5" rx="1" fill="#1e293b"/>
    <circle cx="16" cy="10" r="7" fill="#fde047"/>
    <rect x="13" y="9" width="2" height="3" fill="#0f172a"/>
    <rect x="17" y="9" width="2" height="3" fill="#0f172a"/>
    ${getHeadgear(hat, color, darkColor, lightColor, -1)}
  </g>

  <!-- Frame 3: Walk Up -->
  <g transform="translate(96, 0)">
    <ellipse cx="16" cy="28" rx="8" ry="3" fill="#000000" opacity="0.3"/>
    <rect x="10" y="14" width="12" height="11" rx="2" fill="${color}"/>
    <rect x="10" y="24" width="4" height="4" rx="1" fill="#1e293b"/>
    <rect x="18" y="24" width="4" height="4" rx="1" fill="#1e293b"/>
    <circle cx="16" cy="11" r="7" fill="#eab308"/>
    <rect x="11" y="6" width="10" height="7" rx="2" fill="${darkColor}"/>
    ${getHeadgearBack(hat, color, darkColor)}
  </g>

  <!-- Frame 4: Walk Left -->
  <g transform="translate(128, 0)">
    <ellipse cx="16" cy="28" rx="7" ry="3" fill="#000000" opacity="0.3"/>
    <rect x="11" y="14" width="10" height="11" rx="2" fill="${color}"/>
    <rect x="9" y="24" width="5" height="4" rx="1" fill="#1e293b"/>
    <rect x="17" y="24" width="4" height="4" rx="1" fill="#1e293b"/>
    <circle cx="15" cy="11" r="7" fill="#fde047"/>
    <rect x="11" y="10" width="2" height="3" fill="#0f172a"/>
    ${getHeadgearSide(hat, color, darkColor, "left")}
  </g>

  <!-- Frame 5: Walk Right -->
  <g transform="translate(160, 0)">
    <ellipse cx="16" cy="28" rx="7" ry="3" fill="#000000" opacity="0.3"/>
    <rect x="11" y="14" width="10" height="11" rx="2" fill="${color}"/>
    <rect x="11" y="24" width="4" height="4" rx="1" fill="#1e293b"/>
    <rect x="18" y="24" width="5" height="4" rx="1" fill="#1e293b"/>
    <circle cx="17" cy="11" r="7" fill="#fde047"/>
    <rect x="19" y="10" width="2" height="3" fill="#0f172a"/>
    ${getHeadgearSide(hat, color, darkColor, "right")}
  </g>

  <!-- Frame 6: Working Pose -->
  <g transform="translate(192, 0)">
    <ellipse cx="16" cy="28" rx="10" ry="4" fill="${color}" opacity="0.4" filter="url(#glow-${roleInfo.role})"/>
    <rect x="10" y="14" width="12" height="11" rx="2" fill="${color}"/>
    <rect x="12" y="16" width="8" height="7" rx="1" fill="${lightColor}"/>
    <rect x="10" y="24" width="4" height="4" rx="1" fill="#1e293b"/>
    <rect x="18" y="24" width="4" height="4" rx="1" fill="#1e293b"/>
    <circle cx="16" cy="11" r="7" fill="#fde047"/>
    <rect x="13" y="10" width="2" height="2" fill="#0f172a"/>
    <rect x="17" y="10" width="2" height="2" fill="#0f172a"/>
    ${getHeadgear(hat, color, darkColor, lightColor)}
    <text x="16" y="5" font-size="8" text-anchor="middle" fill="#ffffff">${symbol}</text>
    <circle cx="6" cy="10" r="1.5" fill="${lightColor}"/>
    <circle cx="26" cy="12" r="2" fill="${lightColor}"/>
  </g>
</svg>`;
}

function getHeadgear(hat, color, darkColor, lightColor, yOffset = 0) {
  if (hat === "wizard") {
    return `<polygon points="16,1 10,7 22,7" fill="${darkColor}" transform="translate(0, ${yOffset})"/>
            <polygon points="16,2 12,6 20,6" fill="${color}" transform="translate(0, ${yOffset})"/>`;
  }
  if (hat === "hoodie") {
    return `<path d="M 9,11 C 9,4 23,4 23,11 Z" fill="${darkColor}" opacity="0.8" transform="translate(0, ${yOffset})"/>
            <rect x="10" y="8" width="12" height="3" fill="#0284c7" rx="1" transform="translate(0, ${yOffset})"/>`;
  }
  if (hat === "beret") {
    return `<path d="M 10,6 C 12,2 24,4 22,7 Z" fill="${darkColor}" transform="translate(0, ${yOffset})"/>`;
  }
  if (hat === "crown") {
    return `<polygon points="11,7 13,3 16,6 19,3 21,7" fill="#fbbf24" transform="translate(0, ${yOffset})"/>`;
  }
  if (hat === "visor") {
    return `<rect x="11" y="8" width="10" height="4" rx="1" fill="#ef4444" opacity="0.9" transform="translate(0, ${yOffset})"/>`;
  }
  if (hat === "cap") {
    return `<rect x="10" y="5" width="12" height="3" rx="1" fill="${darkColor}" transform="translate(0, ${yOffset})"/>
            <rect x="8" y="7" width="14" height="2" rx="1" fill="${color}" transform="translate(0, ${yOffset})"/>`;
  }
  if (hat === "halo") {
    return `<ellipse cx="16" cy="3" rx="6" ry="2" fill="none" stroke="${lightColor}" stroke-width="1.5" transform="translate(0, ${yOffset})"/>`;
  }
  if (hat === "glasses") {
    return `<rect x="11" y="9" width="4" height="3" rx="1" fill="none" stroke="#0891b2" stroke-width="1" transform="translate(0, ${yOffset})"/>
            <rect x="17" y="9" width="4" height="3" rx="1" fill="none" stroke="#0891b2" stroke-width="1" transform="translate(0, ${yOffset})"/>
            <line x1="15" y1="10" x2="17" y2="10" stroke="#0891b2" stroke-width="1" transform="translate(0, ${yOffset})"/>`;
  }
  return "";
}

function getHeadgearBack(hat, color, darkColor) {
  if (hat === "wizard") return `<polygon points="16,1 10,7 22,7" fill="${darkColor}"/>`;
  if (hat === "hoodie") return `<path d="M 9,11 C 9,4 23,4 23,11 Z" fill="${darkColor}"/>`;
  if (hat === "beret") return `<path d="M 10,6 C 12,2 24,4 22,7 Z" fill="${darkColor}"/>`;
  return "";
}

function getHeadgearSide(hat, color, darkColor, side) {
  const offset = side === "left" ? -1 : 1;
  if (hat === "wizard") return `<polygon points="${16+offset},1 ${10+offset},7 ${22+offset},7" fill="${darkColor}"/>`;
  if (hat === "hoodie") return `<path d="M ${9+offset},11 C ${9+offset},4 ${23+offset},4 ${23+offset},11 Z" fill="${darkColor}"/>`;
  return "";
}

// Generate Environment Tileset SVG
function generateTilesetSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 128" width="256" height="128" shape-rendering="crispEdges">
  <!-- Floor Tile Dark (32x32) -->
  <g transform="translate(0,0)">
    <rect x="0" y="0" width="32" height="32" fill="#1e1b4b"/>
    <rect x="1" y="1" width="30" height="30" fill="#2e1065"/>
    <line x1="0" y1="0" x2="32" y2="0" stroke="#3b0764" stroke-width="1"/>
    <line x1="0" y1="0" x2="0" y2="32" stroke="#3b0764" stroke-width="1"/>
  </g>

  <!-- Floor Tile Light (32x32) -->
  <g transform="translate(32,0)">
    <rect x="0" y="0" width="32" height="32" fill="#312e81"/>
    <rect x="1" y="1" width="30" height="30" fill="#3730a3"/>
    <line x1="0" y1="0" x2="32" y2="0" stroke="#4338ca" stroke-width="1"/>
  </g>

  <!-- Floor Grid Cyber (32x32) -->
  <g transform="translate(64,0)">
    <rect x="0" y="0" width="32" height="32" fill="#0f172a"/>
    <rect x="2" y="2" width="28" height="28" fill="#1e293b"/>
    <rect x="6" y="6" width="20" height="20" fill="none" stroke="#0284c7" stroke-width="1" opacity="0.3"/>
  </g>

  <!-- Wall Brick (32x32) -->
  <g transform="translate(96,0)">
    <rect x="0" y="0" width="32" height="32" fill="#334155"/>
    <rect x="1" y="2" width="14" height="6" fill="#475569"/>
    <rect x="17" y="2" width="14" height="6" fill="#475569"/>
    <rect x="1" y="10" width="7" height="6" fill="#475569"/>
    <rect x="10" y="10" width="14" height="6" fill="#475569"/>
    <rect x="26" y="10" width="5" height="6" fill="#475569"/>
    <rect x="1" y="18" width="14" height="6" fill="#475569"/>
    <rect x="17" y="18" width="14" height="6" fill="#475569"/>
  </g>

  <!-- Desk (32x32) -->
  <g transform="translate(128,0)">
    <rect x="2" y="6" width="28" height="22" rx="2" fill="#78350f"/>
    <rect x="4" y="8" width="24" height="18" rx="1" fill="#92400e"/>
    <rect x="6" y="24" width="4" height="6" fill="#451a03"/>
    <rect x="22" y="24" width="4" height="6" fill="#451a03"/>
  </g>

  <!-- Computer Workstation (32x32) -->
  <g transform="translate(160,0)">
    <rect x="2" y="6" width="28" height="22" rx="2" fill="#334155"/>
    <rect x="4" y="8" width="24" height="18" rx="1" fill="#475569"/>
    <rect x="8" y="10" width="16" height="10" rx="1" fill="#0284c7"/>
    <rect x="9" y="11" width="14" height="8" fill="#0f172a"/>
    <rect x="10" y="12" width="6" height="2" fill="#38bdf8"/>
    <rect x="10" y="21" width="12" height="4" rx="1" fill="#94a3b8"/>
  </g>

  <!-- Server Rack (32x32) -->
  <g transform="translate(192,0)">
    <rect x="4" y="2" width="24" height="28" rx="2" fill="#0f172a"/>
    <rect x="6" y="4" width="20" height="24" fill="#1e293b"/>
    <circle cx="10" cy="8" r="1.5" fill="#22c55e"/>
    <circle cx="14" cy="8" r="1.5" fill="#3b82f6"/>
    <circle cx="10" cy="14" r="1.5" fill="#ef4444"/>
    <circle cx="14" cy="14" r="1.5" fill="#22c55e"/>
    <circle cx="10" cy="20" r="1.5" fill="#22c55e"/>
    <circle cx="14" cy="20" r="1.5" fill="#f59e0b"/>
    <line x1="6" y1="11" x2="26" y2="11" stroke="#334155" stroke-width="1"/>
    <line x1="6" y1="17" x2="26" y2="17" stroke="#334155" stroke-width="1"/>
    <line x1="6" y1="23" x2="26" y2="23" stroke="#334155" stroke-width="1"/>
  </g>

  <!-- Plant (32x32) -->
  <g transform="translate(224,0)">
    <rect x="10" y="20" width="12" height="10" rx="2" fill="#b45309"/>
    <circle cx="16" cy="14" r="9" fill="#16a34a"/>
    <circle cx="12" cy="12" r="6" fill="#22c55e"/>
    <circle cx="20" cy="13" r="5" fill="#15803d"/>
  </g>
</svg>`;
}

// Write outputs
const manifest = {
  roles: ROLES.map(r => r.role),
  tileSize: 32,
  characterFrameCount: 7,
  tilesetWidth: 256,
  tilesetHeight: 128
};

fs.writeFileSync(path.join(PUBLIC_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(PUBLIC_DIR, "tileset.svg"), generateTilesetSVG());

for (const roleInfo of ROLES) {
  const svg = generateCharacterSVG(roleInfo);
  fs.writeFileSync(path.join(PUBLIC_DIR, `${roleInfo.role}.svg`), svg);
  console.log(`[Sprites] Generated ${roleInfo.role}.svg`);
}

console.log("[Sprites] Sprite assets generated successfully.");
