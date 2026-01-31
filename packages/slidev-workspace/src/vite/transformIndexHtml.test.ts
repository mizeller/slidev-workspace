import { describe, it, expect, vi, beforeEach } from "vitest";

const loadConfigMock = vi.hoisted(() => vi.fn());
const createHeadMock = vi.hoisted(() => vi.fn());
const transformHtmlTemplateMock = vi.hoisted(() => vi.fn());

vi.mock("../scripts/config.js", () => ({
  loadConfig: loadConfigMock,
}));

vi.mock("unhead/server", () => ({
  createHead: createHeadMock,
  transformHtmlTemplate: transformHtmlTemplateMock,
}));

describe("vite transformIndexHtml", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("injects hero metadata via unhead", async () => {
    const headPush = vi.fn();
    createHeadMock.mockReturnValue({ push: headPush });
    transformHtmlTemplateMock.mockResolvedValue("<html>ok</html>");
    loadConfigMock.mockReturnValue({
      hero: {
        title: "Hero Title",
        description: "Hero Description",
      },
    });

    const { transformIndexHtml } = await import("./transformIndexHtml");

    const result = await transformIndexHtml("<html></html>");

    expect(result).toBe("<html>ok</html>");
    expect(headPush).toHaveBeenCalledWith({
      title: "Hero Title",
      meta: [
        { property: "og:title", content: "Hero Title" },
        { property: "og:description", content: "Hero Description" },
      ],
    });
    expect(transformHtmlTemplateMock).toHaveBeenCalledWith(
      { push: headPush },
      "<html></html>",
    );
  });

  it("returns original html when config loading fails", async () => {
    loadConfigMock.mockImplementation(() => {
      throw new Error("boom");
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { transformIndexHtml } = await import("./transformIndexHtml");

    const html = "<html></html>";
    const result = await transformIndexHtml(html);

    expect(result).toBe(html);
    expect(warnSpy).toHaveBeenCalledWith(
      "Failed to inject hero metadata:",
      expect.any(Error),
    );

    warnSpy.mockRestore();
  });
});
