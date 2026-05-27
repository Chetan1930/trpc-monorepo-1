import { db } from "@repo/database";
import { formThemesTable } from "@repo/database/schema";
import { eq } from "@repo/database";

class ThemeService {
  private defaultThemes = [
    {
      name: "Classic",
      description: "Clean and professional",
      isDefault: true,
      isPublic: true,
      config: {
        primaryColor: "#6366f1",
        backgroundColor: "#ffffff",
        textColor: "#1a1a2e",
        fontFamily: "Inter, sans-serif",
        borderRadius: "8px",
        buttonStyle: "solid" as const,
      },
    },
    {
      name: "Dark Mode",
      description: "Dark and sleek",
      isPublic: true,
      config: {
        primaryColor: "#8b5cf6",
        backgroundColor: "#0f0f23",
        textColor: "#e2e8f0",
        fontFamily: "Inter, sans-serif",
        borderRadius: "8px",
        buttonStyle: "rounded" as const,
      },
    },
    {
      name: "Sunset",
      description: "Warm and vibrant",
      isPublic: true,
      config: {
        primaryColor: "#f97316",
        backgroundColor: "#fff7ed",
        textColor: "#431407",
        fontFamily: "Inter, sans-serif",
        borderRadius: "12px",
        buttonStyle: "solid" as const,
      },
    },
    {
      name: "Ocean",
      description: "Cool and calming",
      isPublic: true,
      config: {
        primaryColor: "#0ea5e9",
        backgroundColor: "#f0f9ff",
        textColor: "#0c4a6e",
        fontFamily: "Inter, sans-serif",
        borderRadius: "8px",
        buttonStyle: "solid" as const,
      },
    },
    {
      name: "Forest",
      description: "Natural and earthy",
      isPublic: true,
      config: {
        primaryColor: "#22c55e",
        backgroundColor: "#f0fdf4",
        textColor: "#14532d",
        fontFamily: "Inter, sans-serif",
        borderRadius: "8px",
        buttonStyle: "outline" as const,
      },
    },
    {
      name: "Neon",
      description: "Bold and energetic",
      isPublic: true,
      config: {
        primaryColor: "#ec4899",
        backgroundColor: "#0a0a0a",
        textColor: "#fce7f3",
        fontFamily: "Inter, sans-serif",
        borderRadius: "4px",
        buttonStyle: "solid" as const,
      },
    },
  ];

  public async getPublicThemes() {
    return db
      .select()
      .from(formThemesTable)
      .where(eq(formThemesTable.isPublic, true));
  }

  public async getThemeById(themeId: string) {
    const [theme] = await db
      .select()
      .from(formThemesTable)
      .where(eq(formThemesTable.id, themeId))
      .limit(1);

    return theme || null;
  }

  public async seedDefaultThemes() {
    const existing = await db
      .select()
      .from(formThemesTable)
      .limit(1);

    if (existing.length > 0) return;

    for (const theme of this.defaultThemes) {
      await db.insert(formThemesTable).values(theme);
    }
  }
}

export default ThemeService;
