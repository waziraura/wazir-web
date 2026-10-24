
(() => {
  const app = window.WazirAura;

  if (!app) {
    console.error("WazirAura core script is not loaded.");
    return;
  }

  const tools = [
    {
      id: "product-description",
      name: "Product Description Writer",
      category: "AI",
      icon: "◇",
      description: "Prepare persuasive product descriptions.",
      fields: [
        { name: "product", label: "Product name", required: true },
        { name: "details", label: "Product features", type: "textarea", required: true },
        { name: "audience", label: "Target customers" }
      ]
    },
    {
      id: "hashtags",
      name: "Hashtag Generator",
      category: "Productivity",
      icon: "#",
      description: "Prepare hashtag ideas for your content.",
      fields: [
        { name: "topic", label: "Post topic", required: true },
        { name: "platform", label: "Social platform" },
        { name: "count", label: "Number of hashtags", placeholder: "e.g. 15" }
      ]
    },
    {
      id: "ad-copy",
      name: "Ad Copy Creator",
      category: "AI",
      icon: "↗",
      description: "Prepare advertising copy briefs.",
      fields: [
        { name: "product", label: "Product or service", required: true },
        { name: "offer", label: "Offer or main benefit", type: "textarea", required: true },
        { name: "platform", label: "Ad platform" }
      ]
    },
    {
      id: "youtube-script",
      name: "YouTube Script Writer",
      category: "AI",
      icon: "▶",
      description: "Plan video scripts and talking points.",
      fields: [
        { name: "topic", label: "Video topic", required: true },
        { name: "style", label: "Video style" },
        { name: "duration", label: "Target duration", placeholder: "e.g. 5 minutes" }
      ]
    },
    {
      id: "background-planner",
      name: "Image Background Planner",
      category: "Image",
      icon: "▧",
      description: "Prepare background replacement instructions.",
      fields: [
        { name: "subject", label: "Image subject", required: true },
        { name: "background", label: "Desired background", type: "textarea", required: true },
        { name: "lighting", label: "Lighting and mood" }
      ]
    },
    {
      id: "color-palette",
      name: "Color Palette Generator",
      category: "Image",
      icon: "◉",
      description: "Plan a color palette for a design project.",
      fields: [
        { name: "project", label: "Project type", required: true },
        { name: "mood", label: "Desired mood", required: true },
        { name: "base", label: "Preferred base color" }
      ]
    },
    {
      id: "filename-organizer",
      name: "Filename Organizer",
      category: "Productivity",
      icon: "▤",
      description: "Prepare consistent file naming rules.",
      fields: [
        { name: "filenames", label: "Paste filenames", type: "textarea", required: true },
        { name: "rule", label: "Naming rule", placeholder: "Date, project, sequence..." }
      ]
    },
    {
      id: "json-formatter",
      name: "JSON Formatter",
      category: "Code",
      icon: "{ }",
      description: "Validate and pretty-print JSON data.",
      fields: [
        { name: "json", label: "JSON input", type: "textarea", required: true, placeholder: '{"name":"Wazir Aura"}' }
      ]
    },
    {
      id: "regex-helper",
      name: "Regex Helper",
      category: "Code",
      icon: ".*",
      description: "Prepare regular-expression requirements.",
      fields: [
        { name: "goal", label: "What should the pattern match?", type: "textarea", required: true },
        { name: "examples", label: "Example matching text" }
      ]
    },
    {
      id: "app-idea",
      name: "App Idea Generator",
      category: "AI",
      icon: "▣",
      description: "Structure a mobile or web app concept.",
      fields: [
        { name: "idea", label: "App idea", type: "textarea", required: true },
        { name: "platform", label: "Platform", placeholder: "Web, Android, iOS..." },
        { name: "features", label: "Required features", type: "textarea" }
      ]
    }
  ];

  for (const tool of tools) {
    app.registerTool({
      id: tool.id,
      name: tool.name,
      category: tool.category,
      icon: tool.icon,
      description: tool.description,
      premium: false,

      render({ field, button }) {
        const fieldsHTML = tool.fields.map(item =>
          field(item.label, {
            name: item.name,
            type: item.type || "text",
            placeholder: item.placeholder || "",
            required: Boolean(item.required),
            rows: 5
          })
        ).join("");

        return `
          <div class="tool-intro">
            <p>${tool.description}</p>
          </div>
          <form data-wa-tool-form="${tool.id}">
            ${fieldsHTML}
            ${button("Prepare request", {
              action: "run",
              type: "submit",
              variant: "primary"
            })}
          </form>
          <div class="workspace-result-wrap">
            <div class="result-header"><strong>Result</strong></div>
            <div id="workspace-result" class="workspace-result" aria-live="polite">
              Your result will appear here.
            </div>
          </div>
        `;
      },

      async run({ input }) {
        if (tool.id === "json-formatter") {
          let parsed;

          try {
            parsed = JSON.parse(String(input.json || ""));
          } catch (error) {
            throw new Error("Invalid JSON: " + error.message);
          }

          return {
            text: JSON.stringify(parsed, null, 2)
          };
        }

        const lines = [
          tool.name.toUpperCase() + " — REQUEST PREPARED",
          "",
          ...tool.fields.map(item =>
            item.label + ":\n" +
            (String(input[item.name] || "").trim() || "(not provided)")
          ),
          "",
          "Status: Request prepared.",
          "Note: This tool prepares your input. Connect an appropriate AI service for automatic content generation."
        ];

        return { text: lines.join("\n") };
      }
    });
  }
})();
