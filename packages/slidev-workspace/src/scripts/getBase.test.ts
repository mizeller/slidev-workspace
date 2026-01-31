import { describe, it, expect, vi } from "vitest";

const readFileSyncMock = vi.hoisted(() => vi.fn());

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return {
    ...actual,
    readFileSync: readFileSyncMock,
    default: {
      ...actual,
      readFileSync: readFileSyncMock,
    },
  };
});

describe("scripts getBase", () => {
  it("getBaseFromYaml returns base from yaml", async () => {
    readFileSyncMock.mockReturnValueOnce(
      ["slidev-workspace:", "  base: /foo/"].join("\n"),
    );

    const { getBaseFromYaml } = await import("./getBase");

    expect(getBaseFromYaml()).toBe("/foo/");
  });

  it("getBaseFromYaml warns when yaml cannot be read", async () => {
    readFileSyncMock.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { getBaseFromYaml } = await import("./getBase");

    expect(getBaseFromYaml()).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith("無法讀取 slidev-workspace.yaml");

    warnSpy.mockRestore();
  });
});
