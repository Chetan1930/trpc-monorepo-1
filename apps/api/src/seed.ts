import "dotenv/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, eq } from "@repo/database";
import {
  usersTable,
  formsTable,
  formFieldsTable,
  formThemesTable,
  formResponsesTable,
} from "@repo/database/schema";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production";

const DEMO_EMAIL = "demo@formflow.dev";
const DEMO_PASSWORD = "demo123456";

async function seed() {
  console.log("🌱 Seeding database...");

  // Check if demo user already exists
  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, DEMO_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    console.log("✅ Demo user already exists, skipping seed.");
    console.log(`📧 Email: ${DEMO_EMAIL}`);
    console.log(`🔑 Password: ${DEMO_PASSWORD}`);
    return;
  }

  // Create demo user
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const [demoUser] = await db
    .insert(usersTable)
    .values({
      fullName: "Demo User",
      email: DEMO_EMAIL,
      passwordHash,
    })
    .returning();

  if (!demoUser) throw new Error("Failed to create demo user");
  const demoToken = jwt.sign({ userId: demoUser.id }, JWT_SECRET, { expiresIn: "7d" });

  console.log(`✅ Demo user created: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`🔑 Demo JWT: ${demoToken}`);

  // Create themes
  const themes = [
    {
      name: "Classic",
      description: "Clean and professional",
      isDefault: true,
      isPublic: true,
      creatorId: demoUser.id,
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
      creatorId: demoUser.id,
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
      creatorId: demoUser.id,
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
      creatorId: demoUser.id,
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
      name: "Neon",
      description: "Bold and energetic",
      isPublic: true,
      creatorId: demoUser.id,
      config: {
        primaryColor: "#ec4899",
        backgroundColor: "#0a0a0a",
        textColor: "#fce7f3",
        fontFamily: "Inter, sans-serif",
        borderRadius: "4px",
        buttonStyle: "solid" as const,
      },
    },
    {
      name: "Forest",
      description: "Natural and earthy",
      isPublic: true,
      creatorId: demoUser.id,
      config: {
        primaryColor: "#22c55e",
        backgroundColor: "#f0fdf4",
        textColor: "#14532d",
        fontFamily: "Inter, sans-serif",
        borderRadius: "8px",
        buttonStyle: "outline" as const,
      },
    },
  ];

  const createdThemes: any[] = [];
  for (const theme of themes) {
    const [created] = await db.insert(formThemesTable).values(theme).returning();
    if (!created) throw new Error("Failed to create theme");
    createdThemes.push(created);
  }
  console.log(`✅ Created ${themes.length} themes`);

  // Sample Form 1: Movie Night Survey
  const [form1] = await db
    .insert(formsTable)
    .values({
      title: "Movie Night Survey",
      description: "Help us pick the perfect movie for our next film night! Vote for your favorites.",
      slug: "movie-night-survey",
      visibility: "public",
      status: "published",
      creatorId: demoUser.id,
      themeId: createdThemes[2]!.id, // Sunset theme
      publishedAt: new Date(),
    })
    .returning();

  if (!form1) throw new Error("Failed to create form 1");
  const form1Fields = [
    { type: "short_text", label: "Your Name", placeholder: "Enter your name", required: true, order: 0 },
    { type: "email", label: "Email Address", placeholder: "your@email.com", required: true, order: 1 },
    { type: "single_select", label: "Favorite Movie Genre", options: ["Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Romance", "Documentary"], required: true, order: 2 },
    { type: "multi_select", label: "Which snacks should we get?", options: ["Popcorn", "Nachos", "Candy", "Ice Cream", "Pizza", "Soda"], required: true, order: 3 },
    { type: "rating", label: "How excited are you for movie night?", required: true, order: 4 },
    { type: "long_text", label: "Any movie suggestions?", placeholder: "Tell us your top picks...", required: false, order: 5 },
    { type: "date", label: "Preferred date", required: false, order: 6 },
  ];

  for (const field of form1Fields) {
    await db.insert(formFieldsTable).values({
      formId: form1.id,
      type: field.type as any,
      label: field.label,
      placeholder: field.placeholder || null,
      required: field.required,
      options: (field as any).options || [],
      order: field.order,
    });
  }

  // Seed responses for form 1
  const form1Responses = [
    { data: { "0": "Alice", "1": "alice@example.com", "2": "Sci-Fi", "3": ["Popcorn", "Soda"], "4": 5, "5": "Interstellar would be amazing!" }, respondentName: "Alice" },
    { data: { "0": "Bob", "1": "bob@example.com", "2": "Action", "3": ["Nachos", "Pizza"], "4": 4, "5": "John Wick marathon?" }, respondentName: "Bob" },
    { data: { "0": "Charlie", "1": "charlie@example.com", "2": "Comedy", "3": ["Popcorn", "Candy"], "4": 3 }, respondentName: "Charlie" },
    { data: { "0": "Diana", "1": "diana@example.com", "2": "Romance", "3": ["Ice Cream", "Soda"], "4": 5, "5": "The Notebook or La La Land!" }, respondentName: "Diana" },
    { data: { "0": "Eve", "1": "eve@example.com", "2": "Horror", "3": ["Popcorn", "Nachos"], "4": 2 }, respondentName: "Eve" },
  ];

  for (const response of form1Responses) {
    await db.insert(formResponsesTable).values({
      formId: form1.id,
      data: response.data,
      respondentName: response.respondentName,
    });
  }
  console.log(`✅ Created form "Movie Night Survey" with ${form1Responses.length} responses`);

  // Sample Form 2: Anime Watch Party
  const [form2] = await db
    .insert(formsTable)
    .values({
      title: "Anime Watch Party",
      description: "Which anime should we binge-watch this weekend? Vote now!",
      slug: "anime-watch-party",
      visibility: "public",
      status: "published",
      creatorId: demoUser.id,
      themeId: createdThemes[1]!.id, // Dark Mode theme
      publishedAt: new Date(),
    })
    .returning();

  if (!form2) throw new Error("Failed to create form 2");
  const form2Fields = [
    { type: "short_text", label: "Your Username", placeholder: "Enter your anime username", required: true, order: 0 },
    { type: "single_select", label: "Favorite Anime Genre", options: ["Shonen", "Shojo", "Seinen", "Isekai", "Mecha", "Slice of Life", "Fantasy"], required: true, order: 1 },
    { type: "multi_select", label: "Which anime should we watch?", options: ["Attack on Titan", "Demon Slayer", "One Piece", "Jujutsu Kaisen", "Chainsaw Man", "Spy x Family"], required: true, order: 2 },
    { type: "rating", label: "How hyped are you for the watch party?", required: true, order: 3 },
    { type: "checkbox", label: "What days work for you?", options: ["Friday", "Saturday", "Sunday"], required: true, order: 4 },
    { type: "long_text", label: "Any other anime recommendations?", placeholder: "Share your hidden gems...", required: false, order: 5 },
  ];

  for (const field of form2Fields) {
    await db.insert(formFieldsTable).values({
      formId: form2.id,
      type: field.type as any,
      label: field.label,
      placeholder: field.placeholder || null,
      required: field.required,
      options: (field as any).options || [],
      order: field.order,
    });
  }

  const form2Responses = [
    { data: { "0": "NarutoFan42", "1": "Shonen", "2": ["Attack on Titan", "Demon Slayer"], "3": 5, "4": ["Saturday", "Sunday"], "5": "Watch Fullmetal Alchemist!" }, respondentName: "NarutoFan42" },
    { data: { "0": "ZoroFan", "1": "Seinen", "2": ["One Piece", "Chainsaw Man"], "3": 4, "4": ["Friday", "Saturday"] }, respondentName: "ZoroFan" },
    { data: { "0": "MochiLover", "1": "Shojo", "2": ["Spy x Family", "Jujutsu Kaisen"], "3": 5, "4": ["Sunday"], "5": "Fruits Basket is a must watch!" }, respondentName: "MochiLover" },
    { data: { "0": "Sensei56", "1": "Isekai", "2": ["Demon Slayer", "One Piece"], "3": 3, "4": ["Friday", "Saturday", "Sunday"] }, respondentName: "Sensei56" },
  ];

  for (const response of form2Responses) {
    await db.insert(formResponsesTable).values({
      formId: form2.id,
      data: response.data,
      respondentName: response.respondentName,
    });
  }
  console.log(`✅ Created form "Anime Watch Party" with ${form2Responses.length} responses`);

  // Sample Form 3: Startup Feedback
  const [form3] = await db
    .insert(formsTable)
    .values({
      title: "Startup Idea Validator",
      description: "We're building the next big thing! Give us your feedback on our startup idea.",
      slug: "startup-idea-validator",
      visibility: "public",
      status: "published",
      creatorId: demoUser.id,
      themeId: createdThemes[0]!.id, // Classic theme
      publishedAt: new Date(),
    })
    .returning();

  if (!form3) throw new Error("Failed to create form 3");
  const form3Fields = [
    { type: "short_text", label: "Your Full Name", placeholder: "Enter your name", required: true, order: 0 },
    { type: "email", label: "Work Email", placeholder: "you@company.com", required: true, order: 1 },
    { type: "single_select", label: "Which industry are you in?", options: ["Tech", "Finance", "Healthcare", "Education", "E-commerce", "Other"], required: true, order: 2 },
    { type: "rating", label: "How likely would you use our product?", required: true, order: 3 },
    { type: "multi_select", label: "Which features interest you most?", options: ["AI-powered analytics", "Team collaboration", "Mobile app", "API access", "Custom integrations", "White labeling"], required: true, order: 4 },
    { type: "long_text", label: "What pain points do you have?", placeholder: "Tell us about your biggest challenges...", required: true, order: 5 },
    { type: "number", label: "What would you pay monthly?", placeholder: "Enter amount in USD", required: false, order: 6 },
    { type: "dropdown", label: "How did you hear about us?", options: ["Twitter/X", "LinkedIn", "Friend referral", "Google", "Blog post", "Podcast"], required: false, order: 7 },
  ];

  for (const field of form3Fields) {
    await db.insert(formFieldsTable).values({
      formId: form3.id,
      type: field.type as any,
      label: field.label,
      placeholder: field.placeholder || null,
      required: field.required,
      options: (field as any).options || [],
      order: field.order,
    });
  }

  const form3Responses = [
    { data: { "0": "Sarah Chen", "1": "sarah@techstartup.io", "2": "Tech", "3": 5, "4": ["AI-powered analytics", "API access"], "5": "Data silos between our tools are killing productivity. Need better integration.", "6": 49 }, respondentName: "Sarah Chen" },
    { data: { "0": "Mark Johnson", "1": "mark@financecorp.com", "2": "Finance", "3": 4, "4": ["Team collaboration", "Custom integrations"], "5": "Compliance and security are our biggest concerns. Need enterprise-grade solution.", "6": 99 }, respondentName: "Mark Johnson" },
    { data: { "0": "Priya Patel", "1": "priya@edutech.org", "2": "Education", "3": 3, "4": ["Mobile app", "White labeling"], "5": "Need something our students can use on their phones easily.", "6": 29, "7": "Google" }, respondentName: "Priya Patel" },
    { data: { "0": "Alex Rivera", "1": "alex@healthcare.ai", "2": "Healthcare", "3": 5, "4": ["AI-powered analytics", "Mobile app", "API access"], "5": "Patient data analysis takes too long. AI could help speed up diagnosis.", "6": 79, "7": "LinkedIn" }, respondentName: "Alex Rivera" },
    { data: { "0": "Jordan Kim", "1": "jordan@shopify.merchant", "2": "E-commerce", "3": 4, "4": ["Custom integrations", "Team collaboration"], "5": "Inventory management across multiple platforms is a nightmare.", "6": 39, "7": "Friend referral" }, respondentName: "Jordan Kim" },
  ];

  for (const response of form3Responses) {
    await db.insert(formResponsesTable).values({
      formId: form3.id,
      data: response.data,
      respondentName: response.respondentName,
    });
  }
  console.log(`✅ Created form "Startup Idea Validator" with ${form3Responses.length} responses`);

  // Sample Form 4: Archived Event Feedback (unlisted, archived)
  const [form4] = await db
    .insert(formsTable)
    .values({
      title: "Tech Conference 2025 Feedback",
      description: "Thank you for attending Tech Conference 2025! This form is now closed.",
      slug: "tech-conf-2025-feedback",
      visibility: "unlisted",
      status: "archived",
      creatorId: demoUser.id,
      themeId: createdThemes[0]!.id, // Classic theme
      publishedAt: new Date("2025-03-15"),
    })
    .returning();

  if (!form4) throw new Error("Failed to create form 4");
  const form4Fields = [
    { type: "short_text", label: "Your Name", placeholder: "Enter your name", required: true, order: 0 },
    { type: "email", label: "Email Address", placeholder: "your@email.com", required: true, order: 1 },
    { type: "rating", label: "Overall Experience", required: true, order: 2 },
    { type: "single_select", label: "Favorite Talk", options: ["Keynote: AI Future", "Workshop: Web Dev", "Panel: Startup Growth", "Talk: Cloud Computing", "Workshop: DevOps"], required: true, order: 3 },
    { type: "long_text", label: "Suggestions for next year", placeholder: "What would you like to see?", required: false, order: 4 },
  ];

  for (const field of form4Fields) {
    await db.insert(formFieldsTable).values({
      formId: form4.id,
      type: field.type as any,
      label: field.label,
      placeholder: field.placeholder || null,
      required: field.required,
      options: (field as any).options || [],
      order: field.order,
    });
  }

  const form4Responses = [
    { data: { "0": "John Smith", "1": "john@example.com", "2": 5, "3": "Keynote: AI Future", "4": "Amazing conference! More hands-on workshops please." }, respondentName: "John Smith" },
    { data: { "0": "Emma Wilson", "1": "emma@example.com", "2": 4, "3": "Workshop: Web Dev", "4": "Great networking opportunities." }, respondentName: "Emma Wilson" },
  ];

  for (const response of form4Responses) {
    await db.insert(formResponsesTable).values({
      formId: form4.id,
      data: response.data,
      respondentName: response.respondentName,
    });
  }
  console.log(`✅ Created form "Tech Conference 2025 Feedback" (archived) with ${form4Responses.length} responses`);

  // Sample Form 5: Gaming Community Poll (unlisted, published)
  const [form5] = await db
    .insert(formsTable)
    .values({
      title: "Gaming Community Poll",
      description: "Help shape our gaming community's next tournament! Vote for your favorite games.",
      slug: "gaming-community-poll",
      visibility: "unlisted",
      status: "published",
      creatorId: demoUser.id,
      themeId: createdThemes[4]!.id, // Neon theme
      publishedAt: new Date(),
    })
    .returning();

  if (!form5) throw new Error("Failed to create form 5");
  const form5Fields = [
    { type: "short_text", label: "Gamertag", placeholder: "Enter your gamertag", required: true, order: 0 },
    { type: "single_select", label: "Favorite Game Genre", options: ["FPS", "RPG", "MOBA", "Battle Royale", "Strategy", "Sports"], required: true, order: 1 },
    { type: "multi_select", label: "Which games for the tournament?", options: ["Valorant", "League of Legends", "Fortnite", "CS:GO", "Dota 2", "Overwatch 2"], required: true, order: 2 },
    { type: "checkbox", label: "What platform do you play on?", options: ["PC", "PlayStation", "Xbox", "Nintendo Switch"], required: true, order: 3 },
    { type: "rating", label: "How competitive are you?", required: false, order: 4 },
  ];

  for (const field of form5Fields) {
    await db.insert(formFieldsTable).values({
      formId: form5.id,
      type: field.type as any,
      label: field.label,
      placeholder: field.placeholder || null,
      required: field.required,
      options: (field as any).options || [],
      order: field.order,
    });
  }
  console.log(`✅ Created form "Gaming Community Poll" (unlisted) with ${form5Fields.length} fields`);

  console.log("\n🎉 Seed complete!");
  console.log(`\n📋 Sample Forms Created:`);
  console.log(`   1. Movie Night Survey (public, published) - Sunset theme`);
  console.log(`   2. Anime Watch Party (public, published) - Dark Mode theme`);
  console.log(`   3. Startup Idea Validator (public, published) - Classic theme`);
  console.log(`   4. Tech Conference 2025 Feedback (unlisted, archived) - Classic theme`);
  console.log(`   5. Gaming Community Poll (unlisted, published) - Neon theme`);
  console.log(`\n📋 Demo Credentials:`);
  console.log(`   Email: ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
  console.log(`   JWT: ${demoToken}`);
}

seed()
  .catch(console.error)
  .finally(() => process.exit(0));
