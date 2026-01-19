"use client";

import { useMemo, memo, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";
import { geoMercator } from "d3-geo";
import { regionMarkers, countryRequests } from "@/data/country-data";

const countryColors: Record<string, string> = {
  US: "#1e40af",
  DE: "#FFCE00",
  GB: "#2563eb",
  IN: "#f59e0b",
  BR: "#FF0000",
  SG: "#f59e0b",
  JP: "#dc143c",
  FR: "#1d4ed8",
  CA: "#b91c1c",
  SE: "#2563eb",
  AU: "#3b82f6",
  KR: "#3b82f6",
  NL: "#ea580c",
  CN: "#991b1b",
  RU: "#FF0000",
  MX: "#15803d",
  ES: "#b91c1c",
  IT: "#15803d",
  PL: "#dc2626",
  TR: "#b91c1c",
};

const getCountryColor = (iso2: string): string => {
  return countryColors[iso2] || "var(--ds-gray-400)";
};

const EdgeMarker = memo(
  ({ marker, delay, onHover }: { marker: (typeof regionMarkers)[0]; delay: number; onHover: (marker: (typeof regionMarkers)[0] | null) => void }) => (
    <Marker coordinates={marker.coordinates}>
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1.5, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay,
        }}
        onMouseEnter={() => onHover(marker)}
        onMouseLeave={() => onHover(null)}
        style={{ cursor: "pointer", pointerEvents: "auto" }}
      >
        <polygon
          data-edge={marker.id}
          data-lat={marker.coordinates[1]}
          data-lng={marker.coordinates[0]}
          className="fill-[var(--ds-gray-1000)] stroke-[var(--ds-background-100)]"
          strokeWidth={1}
          strokeOpacity={0.5}
          style={{ paintOrder: "stroke" }}
          points="0,-2.3 -2,1.2 2,1.2"
        />
      </motion.g>
    </Marker>
  )
);
EdgeMarker.displayName = "EdgeMarker";

interface DottedMapProps {
  width?: number;
  height?: number;
}

export default function DottedMap({ width = 1000, height = 560 }: DottedMapProps) {
  const [hoveredMarker, setHoveredMarker] = useState<(typeof regionMarkers)[0] | null>(null);

  const handleMarkerHover = (marker: (typeof regionMarkers)[0] | null) => {
    setHoveredMarker(marker);
  };

  const projection = useMemo(
    () =>
      geoMercator()
        .scale(140)
        .center([15, 25])
        .rotate([0, 0, 0])
        .translate([width / 2, height / 2]),
    [width, height]
  );

  const markerDelays = useMemo(
    () => regionMarkers.map((_, i) => (i * 0.05) % 1),
    []
  );

  const colorPatterns = useMemo(() => {
    return Object.entries(countryColors).map(([code, color]) => ({
      id: `dots-${code}`,
      color,
    }));
  }, []);

  return (
    <div className="relative w-full h-full">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {/* Create a pattern for each country color */}
          {colorPatterns.map(({ id, color }) => (
            <pattern key={id} id={id} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill={color} opacity="1" />
            </pattern>
          ))}
          {/* Default gray pattern */}
          <pattern id="dots-default" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="var(--ds-gray-400)" opacity="0.8" />
          </pattern>
        </defs>
      </svg>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 140,
          center: [15, 25],
          rotate: [0, 0, 0],
        }}
        width={width}
        height={height}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json">
          {({ geographies }) => (
            <>
              {geographies.map((geo) => {
                const iso2 = geo.properties.ISO_A2;
                const hasData = countryRequests[iso2];
                const patternId = hasData ? `dots-${iso2}` : 'dots-default';

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={`url(#${patternId})`}
                    stroke="transparent"
                    strokeWidth={0}
                    style={{
                      default: {
                        fill: `url(#${patternId})`,
                        opacity: 1,
                        transition: "opacity 0.3s ease",
                      },
                      hover: {
                        fill: `url(#${patternId})`,
                        opacity: 1,
                        transition: "opacity 0.2s ease",
                      },
                      pressed: {
                        fill: `url(#${patternId})`,
                        opacity: 1,
                      },
                    }}
                  />
                );
              })}

              {/* Render markers on top */}
              {regionMarkers.map((marker, index) => (
                <EdgeMarker
                  key={marker.id}
                  marker={marker}
                  delay={markerDelays[index]}
                  onHover={handleMarkerHover}
                />
              ))}
            </>
          )}
        </Geographies>
      </ComposableMap>

      <AnimatePresence>
        {hoveredMarker && (() => {
          const coords = projection(hoveredMarker.coordinates);
          if (!coords) return null;
          return (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.15 }}
              className="absolute pointer-events-none z-10 bg-[var(--ds-background-200)] border border-[var(--ds-gray-200)] rounded px-2.5 py-1.5 text-xs font-mono shadow-lg whitespace-nowrap"
              style={{
                left: `${(coords[0] / width) * 100}%`,
                top: `${(coords[1] / height) * 100}%`,
                transform: "translate(-50%, -140%)",
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--ds-gray-1000)]">▲</span>
                <span className="text-[var(--ds-gray-1000)] font-medium">{hoveredMarker.id}</span>
                <span className="text-[var(--ds-gray-500)]">·</span>
                <span className="text-[var(--ds-gray-900)]">{hoveredMarker.name}</span>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
