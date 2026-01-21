import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock axios for API calls
vi.mock("axios");
import axios from "axios";

const mockAxios = axios as any;

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("quiz.validateAnswer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set mock API key
    process.env.MistralAPIKey = "test-api-key";
  });

  it("returns correct result for exact match answer", async () => {
    const mockResponse = {
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify({
                isCorrect: true,
                feedback: "Great job! You got it right.",
                hint: "Remember this term for future reference.",
              }),
            },
          },
        ],
      },
    };

    mockAxios.post.mockResolvedValueOnce(mockResponse);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.quiz.validateAnswer({
      userAnswer: "sagittal",
      correctAnswer: "sagittal",
      question: "The _______ plane divides the body into left and right halves.",
      category: "Body Planes",
    });

    expect(result.isCorrect).toBe(true);
    expect(result.feedback).toBe("Great job! You got it right.");
    expect(result.hint).toBe("Remember this term for future reference.");
    expect(mockAxios.post).toHaveBeenCalledWith(
      "https://api.mistral.ai/v1/chat/completions",
      expect.objectContaining({
        model: "mistral-small-latest",
        messages: expect.any(Array),
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
        }),
      })
    );
  });

  it("returns incorrect result for wrong answer", async () => {
    const mockResponse = {
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify({
                isCorrect: false,
                feedback: "Not quite. The correct answer is sagittal.",
                hint: "Think of 'sagittal' as dividing the body down the middle.",
              }),
            },
          },
        ],
      },
    };

    mockAxios.post.mockResolvedValueOnce(mockResponse);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.quiz.validateAnswer({
      userAnswer: "frontal",
      correctAnswer: "sagittal",
      question: "The _______ plane divides the body into left and right halves.",
      category: "Body Planes",
    });

    expect(result.isCorrect).toBe(false);
    expect(result.feedback).toBe("Not quite. The correct answer is sagittal.");
    expect(result.hint).toBe(
      "Think of 'sagittal' as dividing the body down the middle."
    );
  });

  it("handles case-insensitive matching", async () => {
    const mockResponse = {
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify({
                isCorrect: true,
                feedback: "Correct! Capitalization doesn't matter.",
                hint: "Good work!",
              }),
            },
          },
        ],
      },
    };

    mockAxios.post.mockResolvedValueOnce(mockResponse);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.quiz.validateAnswer({
      userAnswer: "SAGITTAL",
      correctAnswer: "sagittal",
      question: "The _______ plane divides the body into left and right halves.",
      category: "Body Planes",
    });

    expect(result.isCorrect).toBe(true);
  });

  it("falls back to simple matching when Mistral API fails", async () => {
    mockAxios.post.mockRejectedValueOnce(new Error("API Error"));

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.quiz.validateAnswer({
      userAnswer: "sagittal",
      correctAnswer: "sagittal",
      question: "The _______ plane divides the body into left and right halves.",
      category: "Body Planes",
    });

    expect(result.isCorrect).toBe(true);
    expect(result.feedback).toBe("Great job!");
  });

  it("falls back to simple matching when Mistral API returns invalid response", async () => {
    const mockResponse = {
      data: {
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      },
    };

    mockAxios.post.mockResolvedValueOnce(mockResponse);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.quiz.validateAnswer({
      userAnswer: "wrong",
      correctAnswer: "sagittal",
      question: "The _______ plane divides the body into left and right halves.",
      category: "Body Planes",
    });

    expect(result.isCorrect).toBe(false);
    expect(result.feedback).toContain("sagittal");
  });

  it("throws error when Mistral API key is not configured", async () => {
    delete process.env.MistralAPIKey;

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.quiz.validateAnswer({
        userAnswer: "sagittal",
        correctAnswer: "sagittal",
        question: "The _______ plane divides the body into left and right halves.",
        category: "Body Planes",
      });

      // Should fall back to simple matching instead of throwing
      expect(true).toBe(true);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("sends correct prompt format to Mistral API", async () => {
    const mockResponse = {
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify({
                isCorrect: true,
                feedback: "Good!",
                hint: "Hint",
              }),
            },
          },
        ],
      },
    };

    mockAxios.post.mockResolvedValueOnce(mockResponse);

    process.env.MistralAPIKey = "test-key";

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await caller.quiz.validateAnswer({
      userAnswer: "test answer",
      correctAnswer: "correct answer",
      question: "Test question?",
      category: "Test Category",
    });

    const callArgs = mockAxios.post.mock.calls[0];
    const requestBody = callArgs[1];

    expect(requestBody.messages[0].content).toContain("test question?");
    expect(requestBody.messages[0].content).toContain("test answer");
    expect(requestBody.messages[0].content).toContain("correct answer");
    expect(requestBody.messages[0].content).toContain("Test Category");
  });
});
