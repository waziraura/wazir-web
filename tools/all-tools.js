
(() => {
  const app = window.WazirAura;

  if (!app) {
    console.error("WazirAura core script is not loaded.");
    return;
  }

  const tools = [
    {
      id: "chat",
      name: "AI Chat",
      category: "AI",
      icon: "✦",
      description: "Prepare questions for an AI assistant.",
      fields: [
        { name: "question", label: "Your question", type: "textarea", required: true, placeholder: "Ask anything..." }
      ],
      task: "AI answer request"
    },
    {
      id: "image",
      name: "AI Image Studio",
      category: "Image",
      icon: "✧",
      description: "Prepare image generation and editing requests.",
      fields: [
        { name: "prompt", label: "Image description", type: "textarea", required: true, placeholder: "Describe your image..." },
        { name: "style", label: "Visual style", placeholder: "Realistic, cinematic, 3D..." }
      ],
      task: "Image generation request"
    },
    {
      id: "video",
      name: "AI Video Studio",
      category: "Video",
      icon: "▶",
      description: "Plan videos, scenes and storyboards.",
      fields: [
        { name: "idea", label: "Video idea", type: "textarea", required: true, placeholder: "Describe your video..." },
        { name: "duration", label: "Duration", placeholder: "e.g. 30 seconds" }
      ],
      task: "Video creation request"
    },
    {
      id: "audio",
      name: "AI Audio Studio",
      category: "AI",
      icon: "♫",
      description: "Plan voiceovers and audio projects.",
      fields: [
        { name: "script", label: "Audio script or idea", type: "textarea", required: true, placeholder: "Describe the audio..." },
        { name: "voice", label: "Voice style", placeholder: "Calm, energetic, professional..." }
      ],
      task: "Audio creation request"
    },
    {
      id: "music",
      name: "AI Music Maker",
      category: "AI",
      icon: "♪",
      description: "Prepare music concepts and lyrics.",
      fields: [
        { name: "idea", label: "Music idea", type: "textarea", required: true, placeholder: "Genre, mood, instruments..." },
        { name: "lyrics", label: "Lyrics (optional)", type: "textarea", placeholder: "Enter your lyrics..." }
      ],
      task: "Music creation request"
    },
    {
      id: "logo",
      name: "Logo Maker",
      category: "Image",
      icon: "◈",
      description: "Develop a logo concept and design brief.",
      fields: [
        { name: "brand", label: "Brand name", required: true, placeholder: "Your brand name" },
        { name: "idea", label: "Logo concept", type: "textarea", required: true, placeholder: "Describe the logo..." }
      ],
      task: "Logo design brief"
    },
    {
      id: "banner",
      name: "Banner Designer",
      category: "Image",
      icon: "▧",
      description: "Plan banners for social media and websites.",
      fields: [
        { name: "platform", label: "Platform", required: true, placeholder: "LinkedIn, YouTube, Instagram..." },
        { name: "content", label: "Banner details", type: "textarea", required: true, placeholder: "Text, colors, style..." }
      ],
      task: "Banner design brief"
    },
    {
      id: "website",
      name: "Website Builder",
      category: "Code",
      icon: "⌘",
      description: "Plan website pages and features.",
      fields: [
        { name: "project", label: "Website idea", type: "textarea", required: true, placeholder: "Describe your website..." },
        { name: "style", label: "Design style", placeholder: "Modern, minimal, futuristic..." }
      ],
      task: "Website project brief"
    },
    {
      id: "code",
      name: "Code Assistant",
      category: "Code",
      icon: "{ }",
      description: "Prepare coding and debugging requests.",
      fields: [
        { name: "problem", label: "Coding task", type: "textarea", required: true, placeholder: "Describe your problem..." },
        { name: "language", label: "Programming language", placeholder: "JavaScript, Python, HTML..." }
      ],
      task: "Coding request"
    },
    {
      id: "game",
      name: "2D Game Studio",
      category: "Code",
      icon: "▣",
      description: "Plan 2D games and gameplay mechanics.",
      fields: [
        { name: "game", label: "Game idea", type: "textarea", required: true, placeholder: "Describe your game..." },
        { name: "platform", label: "Platform", placeholder: "Browser, PC, mobile..." }
      ],
      task: "2D game project brief"
    },
    {
      id: "research",
      name: "Web Research",
      category: "Productivity",
      icon: "⌕",
      description: "Organize research questions and source requirements.",
      fields: [
        { name: "topic", label: "Research topic", type: "textarea", required: true, placeholder: "What do you need to research?" },
        { name: "scope", label: "Scope", placeholder: "Country, industry, date range..." }
      ],
      task: "Research brief"
    },
    {
      id: "formatter",
      name: "Data Formatter",
      category: "Productivity",
      icon: "▤",
      description: "Prepare text or data for formatting.",
      fields: [
        { name: "data", label: "Paste your data", type: "textarea", required: true, placeholder: "Paste text or rows here..." },
        { name: "format", label: "Desired format", placeholder: "CSV, list, table, clean text..." }
      ],
      task: "Data formatting request"
    },
    {
      id: "writer",
      name: "Text Writer",
      category: "AI",
      icon: "✎",
      description: "Prepare content, descriptions and drafts.",
      fields: [
        { name: "topic", label: "Topic", type: "textarea", required: true, placeholder: "What should the content be about?" },
        { name: "tone", label: "Tone", placeholder: "Professional, friendly, persuasive..." }
      ],
      task: "Writing request"
    },
    {
      id: "translator",
      name: "Translator",
      category: "Productivity",
      icon: "文",
      description: "Prepare text for translation.",
      fields: [
        { name: "text", label: "Text to translate", type: "textarea", required: true, placeholder: "Enter your text..." },
        { name: "language", label: "Target language", required: true, placeholder: "e.g. English, Urdu, Pashto" }
      ],
      task: "Translation request"
    },
    {
      id: "prompts",
      name: "Prompt Generator",
      category: "AI",
      icon: "✧",
      description: "Build detailed prompts for AI tools.",
      fields: [
        { name: "goal", label: "What do you want AI to do?", type: "textarea", required: true, placeholder: "Describe your goal..." },
        { name: "tool", label: "Target AI tool", placeholder: "Image, video, coding, writing..." }
      ],
      task: "Prompt creation request"
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
              Your request result will appear here.
            </div>
          </div>
        `;
      },

      async run({ input }) {
        const lines = [
          tool.task.toUpperCase(),
          "",
          ...tool.fields.map(item =>
            `${item.label}:\n${String(input[item.name] || "").trim() || "(not provided)"}`
          ),
          "",
          "STATUS: Request prepared.",
          "",
          "This tool currently prepares your request only. Connect the appropriate secure AI service or backend to perform real generation, translation, research, or code assistance."
        ];

        return { text: lines.join("\n") };
      }
    });
  }
})();
