// Mock LLM Service for low-fidelity prototyping without an API key

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockLLM = {
  async parseJD(rawText: string) {
    await delay(1000); // Simulate network latency
    return {
      company: "Acme Corp (Mocked)",
      title: "Senior Product Manager",
      location: "San Francisco, CA (Hybrid)",
      salary: 180000
    };
  },

  async tailorResume(jobContent: string) {
    await delay(2000); // Simulate generation time
    return {
      tailoredResume: `# Alex Rivera\n**Senior Product Manager**\n\n*Note: This is a mocked tailored resume generated for the prototype.*\n\n## Experience\n- Highlighted skills specifically matching the job description.\n- Emphasized cross-functional leadership.\n- Streamlined technical details to match the JD's requirements.`,
      storiesUsed: ["mock-story-1", "mock-story-2"],
      explanation: "I emphasized your product leadership and cross-functional collaboration to match the core requirements of this role."
    };
  },

  async prepInterview(jobContent: string, storyCount: number) {
    await delay(1500); // Simulate analysis time
    // We will just return indices 0, 1, 2. The route handler will map these to actual stories if they exist.
    return [
      {
        storyIndex: 0,
        reasoning: "This story perfectly demonstrates your ability to handle ambiguous requirements, which is explicitly mentioned in the JD."
      },
      {
        storyIndex: 1,
        reasoning: "Shows your impact on revenue metrics, addressing the 'business growth' bullet point."
      },
      {
        storyIndex: 2,
        reasoning: "Highlights your technical depth when working closely with engineering teams."
      }
    ];
  }
};
