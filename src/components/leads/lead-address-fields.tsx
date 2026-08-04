"use client";

import { Input, Label, Select } from "@/components/ui/input";
import {
  INDIAN_STATES,
  KERALA_DISTRICTS,
  type LeadAddress,
} from "@/lib/address";

export function LeadAddressFields({
  value,
  onChange,
}: {
  value: LeadAddress;
  onChange: (value: LeadAddress) => void;
}) {
  const showKeralaDistricts = value.state === "Kerala";

  function setField<K extends keyof LeadAddress>(key: K, fieldValue: LeadAddress[K]) {
    onChange({ ...value, [key]: fieldValue });
  }

  return (
    <div className="space-y-4 rounded-lg border border-stone-100 bg-stone-50/50 p-4">
      <p className="text-sm font-medium text-stone-800">Address</p>

      <div>
        <Label htmlFor="address_line1">Address line 1</Label>
        <Input
          id="address_line1"
          value={value.address_line1}
          onChange={(e) => setField("address_line1", e.target.value)}
          placeholder="House / building, street"
        />
      </div>

      <div>
        <Label htmlFor="address_line2">Address line 2</Label>
        <Input
          id="address_line2"
          value={value.address_line2}
          onChange={(e) => setField("address_line2", e.target.value)}
          placeholder="Landmark, area (optional)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="city">City / Town</Label>
          <Input
            id="city"
            value={value.city}
            onChange={(e) => setField("city", e.target.value)}
            placeholder="City or town"
          />
        </div>
        <div>
          <Label htmlFor="district">District</Label>
          {showKeralaDistricts ? (
            <Select
              id="district"
              value={value.district}
              onChange={(e) => setField("district", e.target.value)}
            >
              <option value="">Select district...</option>
              {KERALA_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              id="district"
              value={value.district}
              onChange={(e) => setField("district", e.target.value)}
              placeholder="District"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="state">State</Label>
          <Select
            id="state"
            value={value.state}
            onChange={(e) => {
              const nextState = e.target.value;
              onChange({
                ...value,
                state: nextState,
                district: nextState === "Kerala" ? value.district : value.district,
              });
            }}
          >
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="pin_code">PIN / ZIP code</Label>
          <Input
            id="pin_code"
            value={value.pin_code}
            onChange={(e) =>
              setField("pin_code", e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="6-digit PIN"
            inputMode="numeric"
            maxLength={6}
          />
        </div>
      </div>
    </div>
  );
}
