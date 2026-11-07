import { describe, it } from "node:test";
import assert from "node:assert";
import { WeatherService } from "../src/domain.ts";

describe("WeatherService", () => {
  it("returns forecast for valid coordinates", () => {
    const weather = new WeatherService();
    const forecast = weather.current(51.5, -0.1);
    assert.ok(["sunny", "cloudy", "rain", "snow", "windy"].includes(forecast.condition));
  });

  it("rejects invalid latitude", () => {
    const weather = new WeatherService();
    assert.throws(() => weather.current(100, 0), /invalid latitude/);
  });

  it("rejects invalid longitude", () => {
    const weather = new WeatherService();
    assert.throws(() => weather.current(0, 200), /invalid longitude/);
  });
});
