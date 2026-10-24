
/*
 * WAZIR AURA — CHAT TOOL
 * This is the modular tool template.
 * Connect a real AI provider later to enable AI responses.
 */

window.WazirAura.registerTool({
  id: "chat",
  name: "AI Chat",
  description: "Ask questions and organize your ideas.",
  category: "AI",
  icon: "✦",
  premium: false,

  render({ field, button }) {
    return `
      <form data-wa-tool-form="chat">
        ${field("Your question", {
          name: "question",
          placeholder: "What would you like help with?",
          required: true,
        })}
        ${button("Prepare request", {
          action: "run",
          type: "submit",
        })}
      </form>

      <div class="workspace-result-wrap">
        <div class="result-header">
          <strong>Result</strong>
        </div>
        <div id="workspace-result" class="workspace-result" aria-live="polite">
          A real AI provider is not connected yet.
        </div>
      </div>
    `;
  },

  async run({ input }) {
    const question = String(input.question || "").trim();

    if (!question) {
      throw new Error("Please enter a question first.");
    }

    /*
     * This is not an AI answer.
     * Replace with a secure backend API request when configured.
     */
    return {
      text:
        "Your question has been prepared, but no AI provider is connected yet.\n\n" +
        "Question: " + question + "\n\n" +
        "To generate a real AI response, configure a backend endpoint. " +
        "Never put private API keys in browser JavaScript.",
    };
  },
});
