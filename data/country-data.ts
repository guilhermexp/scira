export const stats = {
  totalRequests: 125000000,
  totalDeployments: 450000,
  aiGatewayRequests: 2500000,
  firewallActions: {
    total: 15000000,
    systemBlocks: 2850000,
    systemChallenges: 6500000,
    customWafBlocks: 670000,
  },
  botManagement: {
    botsBlocked: 850000,
    humansVerified: 4900000,
  },
  cacheHits: 16000000,
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const topCountries = [
  { code: "US", name: "United States", requests: 45000000, color: "#1e40af" },
  { code: "DE", name: "Germany", requests: 8500000, color: "#FFCE00" },
  { code: "GB", name: "United Kingdom", requests: 6800000, color: "#2563eb" },
  { code: "IN", name: "India", requests: 6200000, color: "#f59e0b" },
  { code: "BR", name: "Brazil", requests: 5500000, color: "#FF0000" },
  { code: "JP", name: "Japan", requests: 5200000, color: "#dc143c" },
  { code: "FR", name: "France", requests: 4900000, color: "#1d4ed8" },
];

export const countryRequests: Record<string, { value: number; label: string }> = {
  US: { value: 45000000, label: "United States" },
  DE: { value: 8500000, label: "Germany" },
  GB: { value: 6800000, label: "United Kingdom" },
  IN: { value: 6200000, label: "India" },
  BR: { value: 5500000, label: "Brazil" },
  SG: { value: 4800000, label: "Singapore" },
  JP: { value: 5200000, label: "Japan" },
  FR: { value: 4900000, label: "France" },
  CA: { value: 4200000, label: "Canada" },
  SE: { value: 3800000, label: "Sweden" },
  AU: { value: 3500000, label: "Australia" },
  KR: { value: 3200000, label: "South Korea" },
  NL: { value: 2900000, label: "Netherlands" },
  CN: { value: 2600000, label: "China" },
  RU: { value: 2300000, label: "Russia" },
  MX: { value: 2000000, label: "Mexico" },
  ES: { value: 1800000, label: "Spain" },
  IT: { value: 1600000, label: "Italy" },
  PL: { value: 1400000, label: "Poland" },
  TR: { value: 1200000, label: "Turkey" },
};

export const regionMarkers = [
  { id: "IAD", name: "Washington D.C.", coordinates: [-77.4875, 38.9445] as [number, number] },
  { id: "FRA", name: "Frankfurt", coordinates: [8.6821, 50.1109] as [number, number] },
  { id: "LHR", name: "London", coordinates: [-0.4543, 51.4700] as [number, number] },
  { id: "BOM", name: "Mumbai", coordinates: [72.8777, 19.0760] as [number, number] },
  { id: "GRU", name: "São Paulo", coordinates: [-46.6333, -23.5505] as [number, number] },
  { id: "SIN", name: "Singapore", coordinates: [103.9915, 1.3644] as [number, number] },
  { id: "NRT", name: "Tokyo", coordinates: [140.3929, 35.7720] as [number, number] },
  { id: "CDG", name: "Paris", coordinates: [2.5479, 49.0097] as [number, number] },
  { id: "YYZ", name: "Toronto", coordinates: [-79.6306, 43.6777] as [number, number] },
  { id: "ARN", name: "Stockholm", coordinates: [17.9186, 59.6519] as [number, number] },
  { id: "SYD", name: "Sydney", coordinates: [151.1772, -33.9399] as [number, number] },
  { id: "ICN", name: "Seoul", coordinates: [126.4506, 37.4602] as [number, number] },
  { id: "AMS", name: "Amsterdam", coordinates: [4.7639, 52.3105] as [number, number] },
  { id: "PVG", name: "Shanghai", coordinates: [121.8050, 31.1443] as [number, number] },
  { id: "SVO", name: "Moscow", coordinates: [37.4146, 55.9726] as [number, number] },
  { id: "MEX", name: "Mexico City", coordinates: [-99.0721, 19.4363] as [number, number] },
  { id: "MAD", name: "Madrid", coordinates: [-3.5673, 40.4839] as [number, number] },
  { id: "FCO", name: "Rome", coordinates: [12.2388, 41.8003] as [number, number] },
  { id: "WAW", name: "Warsaw", coordinates: [20.9671, 52.1657] as [number, number] },
];
