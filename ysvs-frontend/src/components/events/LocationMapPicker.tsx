import { useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type Coordinates = {
  lat: number;
  lng: number;
};

type LocationMapPickerProps = {
  value?: Coordinates;
  onChange: (coords: Coordinates) => void;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

const defaultCenter: Coordinates = { lat: 15.3694, lng: 44.191 };

function ClickHandler({ onChange }: { onChange: (coords: Coordinates) => void }) {
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return null;
}

function Recenter({ center }: { center: Coordinates }) {
  const map = useMap();
  map.setView([center.lat, center.lng], map.getZoom());
  return null;
}

export function LocationMapPicker({ value, onChange }: LocationMapPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const current = value || defaultCenter;
  const mapCenter = useMemo(() => [current.lat, current.lng] as [number, number], [current]);

  const onSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError("");
    try {
      const params = new URLSearchParams({
        format: "json",
        q: query.trim(),
        addressdetails: "1",
        limit: "6",
      });

      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: {
          "Accept-Language": "ar,en",
        },
      });

      if (!response.ok) {
        throw new Error("search_failed");
      }

      const data = (await response.json()) as NominatimResult[];
      setResults(data);
      if (!data.length) {
        setSearchError("لم يتم العثور على نتائج مطابقة");
      }
    } catch {
      setSearchError("تعذر البحث حالياً، حاول مرة أخرى");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div>
        <h3 className="font-semibold">موقع المؤتمر على الخريطة</h3>
        <p className="text-xs text-muted-foreground">
          اضغط على الخريطة لتحديد الموقع أو ابحث باسم المكان بدون استخدام Google API.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ابحث عن مدينة أو عنوان..."
        />
        <Button type="button" variant="outline" onClick={() => void onSearch()} disabled={isSearching}>
          {isSearching ? "جاري البحث..." : "بحث"}
        </Button>
      </div>

      {!!searchError && <p className="text-xs text-destructive">{searchError}</p>}

      {results.length > 0 && (
        <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-2">
          {results.map((result) => (
            <button
              key={result.place_id}
              type="button"
              className="w-full rounded-md border px-3 py-2 text-right text-xs hover:bg-muted"
              onClick={() => {
                const lat = Number(result.lat);
                const lng = Number(result.lon);
                onChange({ lat, lng });
                setResults([]);
                setQuery(result.display_name);
              }}
            >
              {result.display_name}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border">
        <MapContainer center={mapCenter} zoom={13} style={{ height: 320, width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onChange={onChange} />
          <Recenter center={current} />
          <Marker position={[current.lat, current.lng]} />
        </MapContainer>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>خط العرض (Latitude)</Label>
          <Input
            type="number"
            step="0.000001"
            value={Number.isFinite(current.lat) ? current.lat : ""}
            onChange={(event) => {
              const lat = Number(event.target.value);
              onChange({ lat, lng: current.lng });
            }}
          />
        </div>
        <div className="space-y-1">
          <Label>خط الطول (Longitude)</Label>
          <Input
            type="number"
            step="0.000001"
            value={Number.isFinite(current.lng) ? current.lng : ""}
            onChange={(event) => {
              const lng = Number(event.target.value);
              onChange({ lat: current.lat, lng });
            }}
          />
        </div>
      </div>
    </div>
  );
}
