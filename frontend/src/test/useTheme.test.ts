import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useTheme } from "../hooks/useTheme";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

describe("useTheme", () => {
  it("defaults to light mode when no preference is stored", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(false);
  });

  it("reads dark preference from localStorage", () => {
    localStorage.setItem("theme", "dark");
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(true);
  });

  it("reads light preference from localStorage", () => {
    localStorage.setItem("theme", "light");
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(false);
  });

  it("toggle switches from light to dark", () => {
    localStorage.setItem("theme", "light");
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("toggle switches from dark to light", () => {
    localStorage.setItem("theme", "dark");
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
  });
});
