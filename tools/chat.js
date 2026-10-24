
window.WazirAura.registerTool({
  id: "chat",
  name: "AI Chat",
  description: "Ask questions, explore ideas, and prepare helpful answers.",
  category: "AI",
  icon: "✦",
  premium: false,

  render({ field, button }) {
    return `
      <div class="tool-intro">
        <p>Enter your question below to prepare your request.</p>
      </div>

      <form data-wa-tool-form="chat">
        ${field("Your question", {
          name: "question",
          type: "textarea",
          placeholder: "Ask anything...",
          required: true,
          rows: 5
        })}

        ${button("Prepare request", {
          action: "run",
          type: "submit",
          variant: "primary"
        })}
      </form>

      <div class="workspace-result-wrap">
        <div class="result-header">
          <strong>Result</strong>
        </div>
        <div
          id="workspace-result"
          class="workspace-result"
          aria-live="polite"
        >Your result will appear here.</div>
      </div>
    `;
  },

  async run({ input }) {
    const question = String(input.question || "").trim();

    if (!question) {
      throw new Error("Please enter a question first.");
    }

    return {
      text:
        "Your question has been prepared successfully.\n\n" +
        "Question:\n" + question +
        "\n\nNote: A real AI service is not connected yet. " +
        "To generate AI answers, we will need to connect a secure backend API. " +
        "Never put a private API key in frontend JavaScript."
    };
  }
});
