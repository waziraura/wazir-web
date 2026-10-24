
(() => {
  const app = window.WazirAura;

  if (!app) {
    console.error("WazirAura core script is not loaded.");
    return;
  }

  const tools = [
    {
      id: "resume",
      name: "Resume Builder",
      category: "Productivity",
      icon: "▤",
      description: "Prepare a professional CV or resume.",
      task: "Resume",
      fields: [
        { name: "name", label: "Full name", required: true },
        { name: "skills", label: "Skills and experience", type: "textarea", required: true },
        { name: "target", label: "Target job or industry" }
      ]
    },
    {
      id: "email",
      name: "Email Writer",
      category: "Productivity",
      icon: "✉",
      description: "Prepare professional email drafts.",
      task: "Email draft",
      fields: [
        { name: "purpose", label: "Email purpose", required: true, type: "textarea" },
        { name: "recipient", label: "Who is the email for?" },
        { name: "tone", label: "Tone", placeholder: "Professional, friendly..." }
      ]
    },
    {
      id: "social",
      name: "Social Post Maker",
      category: "AI",
      icon: "◎",
      description: "Plan social media posts and captions.",
      task: "Social media post",
      fields: [
        { name: "topic", label: "Post topic", required: true, type: "textarea" },
        { name: "platform", label: "Platform", placeholder: "LinkedIn, Instagram..." },
        { name: "tone", label: "Tone or style" }
      ]
    },
    {
      id: "seo",
      name: "SEO Planner",
      category: "Productivity",
      icon: "⌕",
      description: "Prepare SEO goals and keyword research briefs.",
      task: "SEO plan",
      fields: [
        { name: "website", label: "Website or business", required: true },
        { name: "topic", label: "Main topic or keywords", required: true, type: "textarea" },
        { name: "audience", label: "Target audience" }
      ]
    },
    {
      id: "summarizer",
      name: "Text Summarizer",
      category: "Productivity",
      icon: "≡",
      description: "Prepare text for summarization.",
      task: "Summary request",
      fields: [
        { name: "text", label: "Text to summarize", required: true, type: "textarea" },
        { name: "length", label: "Summary length", placeholder: "Short, medium, detailed..." }
      ]
    },
    {
      id: "story",
      name: "Story Creator",
      category: "AI",
      icon: "✎",
      description: "Develop story ideas and character briefs.",
      task: "Story brief",
      fields: [
        { name: "idea", label: "Story idea", required: true, type: "textarea" },
        { name: "genre", label: "Genre", placeholder: "Fantasy, adventure, comedy..." },
        { name: "length", label: "Desired length" }
      ]
    },
    {
      id: "thumbnail",
      name: "Thumbnail Planner",
      category: "Image",
      icon: "▧",
      description: "Plan engaging video thumbnail designs.",
      task: "Thumbnail design brief",
      fields: [
        { name: "title", label: "Video title", required: true },
        { name: "idea", label: "Thumbnail concept", required: true, type: "textarea" },
        { name: "style", label: "Style or colors" }
      ]
    },
    {
      id: "presentation",
      name: "Presentation Planner",
      category: "Productivity",
      icon: "▥",
      description: "Organize slide content for presentations.",
      task: "Presentation brief",
      fields: [
        { name: "topic", label: "Presentation topic", required: true },
        { name: "audience", label: "Audience" },
        { name: "slides", label: "Number of slides", placeholder: "e.g. 10" }
      ]
    },
    {
      id: "business",
      name: "Business Idea Studio",
      category: "AI",
      icon: "◇",
      description: "Structure business ideas and plans.",
      task: "Business plan brief",
      fields: [
        { name: "idea", label: "Business idea", required: true, type: "textarea" },
        { name: "market", label: "Target market" },
        { name: "budget", label: "Estimated budget" }
      ]
    },
    {
      id: "quiz",
      name: "Quiz Maker",
      category: "Productivity",
      icon: "☷",
      description: "Prepare quiz and learning activity requests.",
      task: "Quiz brief",
      fields: [
        { name: "subject", label: "Subject or topic", required: true },
        { name: "level", label: "Difficulty level", placeholder: "Beginner, intermediate..." },
        { name: "count", label: "Number of questions", placeholder: "e.g. 10" }
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
        const result = [
          `${tool.task.toUpperCase()} — PREPARED`,
          "",
          ...tool.fields.map(item =>
            `${item.label}:\n${String(input[item.name] || "").trim() || "(not provided)"}`
          ),
          "",
          "Status: Request prepared.",
          "Note: This tool prepares a brief. Connect an appropriate AI service or backend for automatic content generation."
        ];

        return { text: result.join("\n") };
      }
    });
  }
})();
