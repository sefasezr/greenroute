import React, { useMemo, useState, useEffect, useCallback } from "react";
import Papa from "papaparse";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";

function toNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function normalizeStr(x) {
  return String(x ?? "").trim();
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeRouteKm(stops) {
  if (!stops || stops.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < stops.length; i++) {
    sum += haversineKm(
      stops[i - 1].latitude,
      stops[i - 1].longitude,
      stops[i].latitude,
      stops[i].longitude
    );
  }
  return sum;
}

// OSRM API ile gerçek yol rotası çekme
async function fetchOSRMRoute(stops) {
  if (!stops || stops.length < 2) return [];

  // OSRM koordinatları "lon,lat" formatında istiyor
  const coords = stops.map(s => `${s.longitude},${s.latitude}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM API error');
    const data = await res.json();

    if (data.routes && data.routes[0] && data.routes[0].geometry) {
      // GeoJSON koordinatları [lon, lat] -> Leaflet için [lat, lon]
      return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
    }
  } catch (err) {
    console.warn('OSRM route fetch failed, falling back to straight lines:', err);
  }

  // Fallback: düz çizgi
  return stops.map(s => [s.latitude, s.longitude]);
}

function buildIndex(rows) {
  // date + vehicle_id -> ordered stops
  const idx = new Map();
  for (const r of rows) {
    const date = normalizeStr(r.date);
    const vehicle_id = normalizeStr(r.vehicle_id);
    const stop_order = toNum(r.stop_order);
    const latitude = toNum(r.latitude);
    const longitude = toNum(r.longitude);

    if (!date || !vehicle_id) continue;
    if (latitude == null || longitude == null) continue;

    const key = `${date}__${vehicle_id}`;
    if (!idx.has(key)) idx.set(key, []);
    idx.get(key).push({
      date,
      vehicle_id,
      vehicle_type: normalizeStr(r.vehicle_type),
      stop_order: stop_order ?? 0,
      Mahalle: normalizeStr(r.Mahalle),
      latitude,
      longitude,
    });
  }

  for (const [k, arr] of idx.entries()) {
    arr.sort((a, b) => (a.stop_order ?? 0) - (b.stop_order ?? 0));
    idx.set(k, arr);
  }

  return idx;
}

function uniqueOptionsFromIndices(optIndex, baseIndex) {
  // date + vehicle set = union of both indices
  const dates = new Set();
  const vehiclesByDate = new Map();

  const addKey = (key) => {
    const [date, vehicle_id] = key.split("__");
    dates.add(date);
    if (!vehiclesByDate.has(date)) vehiclesByDate.set(date, new Set());
    vehiclesByDate.get(date).add(vehicle_id);
  };

  for (const key of optIndex.keys()) addKey(key);
  for (const key of baseIndex.keys()) addKey(key);

  const dateList = Array.from(dates).sort().filter(d => d >= "2025-12-19");
  const vehiclesMap = new Map();
  for (const [date, set] of vehiclesByDate.entries()) {
    vehiclesMap.set(
      date,
      Array.from(set).sort((a, b) => Number(a) - Number(b))
    );
  }

  return { dateList, vehiclesMap };
}

async function fetchCsvFromPublic(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`CSV okunamadı: ${path} (${res.status})`);
  const text = await res.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  return parsed.data;
}

export default function App() {
  const [optRows, setOptRows] = useState([]);
  const [baseRows, setBaseRows] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [viewMode, setViewMode] = useState("both"); // "baseline", "optimized", "both"

  // CO2 varsayımları
  const [lPerKm, setLPerKm] = useState(0.4);
  const [kgCo2PerL, setKgCo2PerL] = useState(2.68);

  React.useEffect(() => {
    (async () => {
      const [opt, base] = await Promise.all([
        fetchCsvFromPublic("/data/phase5_routes.csv"),
        fetchCsvFromPublic("/data/phase5_baseline_routes.csv"),
      ]);
      setOptRows(opt);
      setBaseRows(base);
      setLoaded(true);
    })().catch((e) => {
      console.error(e);
      alert(String(e));
    });
  }, []);

  const optIndex = useMemo(() => buildIndex(optRows), [optRows]);
  const baseIndex = useMemo(() => buildIndex(baseRows), [baseRows]);

  const options = useMemo(
    () => uniqueOptionsFromIndices(optIndex, baseIndex),
    [optIndex, baseIndex]
  );

  // Varsayılan seçimi otomatik doldur
  React.useEffect(() => {
    if (!selectedDate && options.dateList.length > 0) {
      setSelectedDate(options.dateList[0]);
    }
  }, [options.dateList, selectedDate]);

  React.useEffect(() => {
    if (selectedDate) {
      const vehicles = options.vehiclesMap.get(selectedDate) || [];
      if (vehicles.length > 0 && !selectedVehicle) {
        setSelectedVehicle(String(vehicles[0]));
      }
    }
  }, [selectedDate, options.vehiclesMap, selectedVehicle]);

  const key =
    selectedDate && selectedVehicle ? `${selectedDate}__${selectedVehicle}` : "";

  const optStops = useMemo(() => (key ? optIndex.get(key) || [] : []), [key, optIndex]);
  const baseStops = useMemo(() => (key ? baseIndex.get(key) || [] : []), [key, baseIndex]);

  // Gerçek yol rotaları için state
  const [optRoadLine, setOptRoadLine] = useState([]);
  const [baseRoadLine, setBaseRoadLine] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);

  // OSRM'den rotaları çek
  useEffect(() => {
    let cancelled = false;

    async function loadRoutes() {
      if (optStops.length < 2 && baseStops.length < 2) {
        setOptRoadLine([]);
        setBaseRoadLine([]);
        return;
      }

      setRouteLoading(true);

      try {
        const [optRoute, baseRoute] = await Promise.all([
          optStops.length >= 2 ? fetchOSRMRoute(optStops) : [],
          baseStops.length >= 2 ? fetchOSRMRoute(baseStops) : []
        ]);

        if (!cancelled) {
          setOptRoadLine(optRoute);
          setBaseRoadLine(baseRoute);
        }
      } catch (err) {
        console.error('Route loading error:', err);
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    }

    loadRoutes();
    return () => { cancelled = true; };
  }, [optStops, baseStops]);

  // Fallback olarak düz çizgi (OSRM çalışmadığında)
  const optLine = useMemo(() => optStops.map((s) => [s.latitude, s.longitude]), [optStops]);
  const baseLine = useMemo(() => baseStops.map((s) => [s.latitude, s.longitude]), [baseStops]);

  // Kullanılacak çizgiler (yol rotası varsa onu kullan, yoksa düz çizgi)
  const displayOptLine = optRoadLine.length > 0 ? optRoadLine : optLine;
  const displayBaseLine = baseRoadLine.length > 0 ? baseRoadLine : baseLine;

  const mapCenter = useMemo(() => {
    const ref = optStops[0] || baseStops[0];
    return ref ? [ref.latitude, ref.longitude] : [40.195, 29.06];
  }, [optStops, baseStops]);

  const optKm = useMemo(() => computeRouteKm(optStops), [optStops]);
  const baseKm = useMemo(() => computeRouteKm(baseStops), [baseStops]);

  const savedKm = useMemo(() => Math.max(0, baseKm - optKm), [baseKm, optKm]);
  const savedPct = useMemo(() => (baseKm > 0 ? (savedKm / baseKm) * 100 : 0), [savedKm, baseKm]);

  // Yakıt/CO2: aynı varsayımlarla baseline vs optimized farkı
  const optFuelL = useMemo(() => optKm * lPerKm, [optKm, lPerKm]);
  const baseFuelL = useMemo(() => baseKm * lPerKm, [baseKm, lPerKm]);
  const fuelSavedL = useMemo(() => Math.max(0, baseFuelL - optFuelL), [baseFuelL, optFuelL]);

  const optCo2Kg = useMemo(() => optFuelL * kgCo2PerL, [optFuelL, kgCo2PerL]);
  const baseCo2Kg = useMemo(() => baseFuelL * kgCo2PerL, [baseFuelL, kgCo2PerL]);
  const co2SavedKg = useMemo(() => Math.max(0, baseCo2Kg - optCo2Kg), [baseCo2Kg, optCo2Kg]);

  const vehiclesForDate = useMemo(() => {
    if (!selectedDate) return [];
    return options.vehiclesMap.get(selectedDate) || [];
  }, [selectedDate, options.vehiclesMap]);

  return (
    <div className="page">
      <div className="sidebar">
        <div className="logoHeader">
          <img src="/images/logo.jpeg" alt="Logo" className="logo" />
          <div className="brandText">
            <span className="brandName">GreenRoute</span>
            <span className="brandTagline">Sürdürülebilir Rotalar</span>
          </div>
        </div>

        <div className="statusBadge">
          {loaded ? (
            <span className="badge success">✓ Veriler Yüklendi</span>
          ) : (
            <span className="badge loading">⟳ Yükleniyor...</span>
          )}
        </div>

        <div className="sectionTitle">
          <span className="sectionIcon">📍</span>
          Rota Seçimi
        </div>

        <div className="field">
          <label>Tarih (date)</label>
          <select
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedVehicle("");
            }}
          >
            <option value="">Seç...</option>
            {options.dateList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Araç (vehicle_id)</label>
          <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}>
            <option value="">Seç...</option>
            {vehiclesForDate.map((v) => (
              <option key={v} value={String(v)}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="sectionTitle">
          <span className="sectionIcon">📊</span>
          Rota Metrikleri
        </div>
        <div className="card">
          <div className="kpiRow">
            <div className="kpi">
              <div className="kpiTitle">Baseline km</div>
              <div className="kpiValue">{baseKm.toFixed(2)}</div>
            </div>
            <div className="kpi">
              <div className="kpiTitle">Optimize km</div>
              <div className="kpiValue">{optKm.toFixed(2)}</div>
            </div>
          </div>

          <div className="kpiRow" style={{ marginTop: 10 }}>
            <div className="kpi">
              <div className="kpiTitle">Tasarruf (km)</div>
              <div className="kpiValue">{savedKm.toFixed(2)}</div>
            </div>
            <div className="kpi">
              <div className="kpiTitle">Tasarruf (%)</div>
              <div className="kpiValue">{savedPct.toFixed(2)}</div>
            </div>
          </div>

          <div className="kpiRow" style={{ marginTop: 10 }}>
            <div className="kpi">
              <div className="kpiTitle">Baseline durak</div>
              <div className="kpiValue">{baseStops.length}</div>
            </div>
            <div className="kpi">
              <div className="kpiTitle">Optimize durak</div>
              <div className="kpiValue">{optStops.length}</div>
            </div>
          </div>
        </div>

        <div className="sectionTitle">
          <span className="sectionIcon">🌱</span>
          Yakıt & CO₂
        </div>
        <div className="card">
          <div className="cardSubtitle">Emisyon Hesaplama</div>

          <div className="field">
            <label>Tüketim (L/km)</label>
            <input
              type="number"
              step="0.01"
              value={lPerKm}
              onChange={(e) => setLPerKm(Number(e.target.value))}
            />
          </div>

          <div className="field">
            <label>Emisyon faktörü (kgCO₂ / L)</label>
            <input
              type="number"
              step="0.01"
              value={kgCo2PerL}
              onChange={(e) => setKgCo2PerL(Number(e.target.value))}
            />
          </div>

          <div className="kpiRow">
            <div className="kpi">
              <div className="kpiTitle">Yakıt tasarrufu (L)</div>
              <div className="kpiValue">{fuelSavedL.toFixed(1)}</div>
            </div>
            <div className="kpi">
              <div className="kpiTitle">CO₂ tasarrufu (kg)</div>
              <div className="kpiValue">{co2SavedKg.toFixed(1)}</div>
            </div>
          </div>

          <div className="small" style={{ marginTop: 8 }}>
            Not: Bu, sadece rota km üzerinden kaba tahmindir. Rölanti vs dahil değil.
          </div>
        </div>

        <div className="sectionTitle">
          <span className="sectionIcon">🗺️</span>
          Harita Görünümü
        </div>
        <div className="card">
          <div className="toggleGroup">
            <button
              className={`toggleBtn ${viewMode === "both" ? "active" : ""}`}
              onClick={() => setViewMode("both")}
            >
              Karşılaştır
            </button>
            <button
              className={`toggleBtn ${viewMode === "baseline" ? "active" : ""}`}
              onClick={() => setViewMode("baseline")}
            >
              Baseline
            </button>
            <button
              className={`toggleBtn ${viewMode === "optimized" ? "active" : ""}`}
              onClick={() => setViewMode("optimized")}
            >
              Optimize
            </button>
          </div>
          <div className="small" style={{ marginTop: 8 }}>
            <b>Mavi</b>: Optimize | <b>Kırmızı (kesikli)</b>: Baseline
            {routeLoading && <span style={{ marginLeft: 8, color: '#f57c00' }}>⚡ Rota yükleniyor...</span>}
          </div>
        </div>

        <div className="hint" style={{ marginTop: 10 }}>
          <div className="small">
            Harita:
            <br />- <b>Mavi</b> çizgi: Optimize rota
            <br />- <b>Kırmızı (kesikli)</b> çizgi: Baseline rota
            <br />
            Marker’lar optimize durakları gösterir (istersen baseline marker da ekleriz).
          </div>
        </div>
      </div>

      <div className="mapWrap">
        <MapContainer center={mapCenter} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution="&copy; OpenStreetMap katkıcıları"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 🔴 BASELINE */}
          {(viewMode === "baseline" || viewMode === "both") && displayBaseLine.length >= 2 && (
            <Polyline
              positions={displayBaseLine}
              pathOptions={{ color: "red", weight: 4, opacity: 0.8, dashArray: "6" }}
            />
          )}

          {/* 🔵 OPTIMIZED */}
          {(viewMode === "optimized" || viewMode === "both") && displayOptLine.length >= 2 && (
            <Polyline positions={displayOptLine} pathOptions={{ color: "blue", weight: 4, opacity: 0.85 }} />
          )}

          {/* OPT markers */}
          {optStops.map((s, i) => (
            <Marker key={`opt-${i}`} position={[s.latitude, s.longitude]}>
              <Popup>
                <div>
                  <b>Optimize Stop #{s.stop_order}</b>
                </div>
                <div>Mahalle: {s.Mahalle || "-"}</div>
                <div>Vehicle: {s.vehicle_id}</div>
                <div>Date: {s.date}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
