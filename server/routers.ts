import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import axios from "axios";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  quiz: router({
    validateAnswer: publicProcedure
      .input(
        z.object({
          userAnswer: z.string(),
          correctAnswer: z.string(),
          question: z.string(),
          category: z.string(),
          model: z.enum(["ministral-3", "mistral-small", "magistral-small", "mistral-medium", "magistral-medium", "mistral-large"]).optional().default("mistral-medium"),
        })
      )
      .mutation(async ({ input }) => {
        const { userAnswer, correctAnswer, question, category, model } = input;

        try {
          const mistralApiKey = process.env.MistralAPIKey;
          if (!mistralApiKey) {
            throw new Error("Mistral API key not configured");
          }

          const prompt = `You are an anatomy teacher grading a fill-in-the-blank anatomy question.

Question: "${question}"
Category: ${category}
Correct Answer: "${correctAnswer}"
Student's Answer: "${userAnswer}"

Your task:
1. Determine if the student's answer is correct (exact match, common synonyms, or acceptable variations)
2. Provide feedback

Respond with a JSON object with these fields:
{
  "isCorrect": boolean,
  "feedback": "A brief, encouraging message about their answer (1-2 sentences)",
  "hint": "A helpful hint for remembering this term (1 sentence)"
}

Be lenient with:
- Capitalization differences (sagittal vs Sagittal)
- Singular/plural variations (kidney vs kidneys)
- Common medical synonyms (frontal plane = coronal plane)
- Minor spelling variations

Be strict with:
- Completely wrong answers
- Answers that are close but medically incorrect`;

          const modelMap: Record<string, string> = {
            "ministral-3": "ministral-3",
            "mistral-small": "mistral-small-latest",
            "magistral-small": "mistral-small-latest",
            "mistral-medium": "mistral-medium-latest",
            "magistral-medium": "mistral-medium-latest",
            "mistral-large": "mistral-large-latest",
          };

          const response = await axios.post(
            "https://api.mistral.ai/v1/chat/completions",
            {
              model: modelMap[model],
              messages: [
                {
                  role: "user",
                  content: prompt,
                },
              ],
              response_format: {
                type: "json_object",
              },
            },
            {
              headers: {
                Authorization: `Bearer ${mistralApiKey}`,
                "Content-Type": "application/json",
              },
            }
          );

          const content = response.data.choices[0]?.message?.content;
          if (!content) {
            throw new Error("No response from Mistral API");
          }

          const result = JSON.parse(content);

          return {
            isCorrect: result.isCorrect,
            feedback: result.feedback,
            hint: result.hint,
          };
        } catch (error) {
          console.error("Error validating answer with Mistral:", error);
          // Fallback to simple string matching if Mistral fails
          const isCorrect =
            userAnswer.toLowerCase().trim() ===
            correctAnswer.toLowerCase().trim();
          return {
            isCorrect,
            feedback: isCorrect
              ? "Great job!"
              : `The correct answer is "${correctAnswer}"`,
            hint: "Try again!",
          };
        }
      }),

    generateSummary: publicProcedure
      .input(
        z.object({
          results: z.array(
            z.object({
              question: z.string(),
              userAnswer: z.string(),
              correctAnswer: z.string(),
              isCorrect: z.boolean(),
            })
          ),
          model: z.string().optional().default("mistral-medium"),
        })
      )
      .mutation(async ({ input }) => {
        const { results, model } = input;
        const wrongAnswers = results.filter(r => !r.isCorrect);

        if (wrongAnswers.length === 0) {
          return {
            summary: "Perfect score! You demonstrated excellent mastery of all terms in this section.",
            improvementTips: "Keep challenging yourself with harder categories or faster completion times."
          };
        }

        try {
          const mistralApiKey = process.env.MistralAPIKey;
          if (!mistralApiKey) {
            throw new Error("Mistral API key not configured");
          }

          const prompt = `You are an anatomy tutor. A student just finished a practice quiz and missed the following questions:

${wrongAnswers.map((r, i) => `${i + 1}. Question: "${r.question}"
   Student Answer: "${r.userAnswer}"
   Correct Answer: "${r.correctAnswer}"`).join("\n")}

Your task:
1. Analyze WHY the student might have made these mistakes (e.g., confused similar terms, spelling error, wrong location).
2. Provide specific improvement tips for these concepts.

Respond with a JSON object:
{
  "summary": "A 2-3 sentence analysis of their errors.",
  "improvementTips": "2-3 specific bullet points on what to study to fix these particular errors."
}`;

          const modelMap: Record<string, string> = {
            "ministral-3": "ministral-3",
            "mistral-small": "mistral-small-latest",
            "magistral-small": "mistral-small-latest",
            "mistral-medium": "mistral-medium-latest",
            "magistral-medium": "mistral-medium-latest",
            "mistral-large": "mistral-large-latest",
          };

          const selectedModel = modelMap[model] || "mistral-medium-latest";

          const response = await axios.post(
            "https://api.mistral.ai/v1/chat/completions",
            {
              model: selectedModel,
              messages: [
                {
                  role: "user",
                  content: prompt,
                },
              ],
              response_format: {
                type: "json_object",
              },
            },
            {
              headers: {
                Authorization: `Bearer ${mistralApiKey}`,
                "Content-Type": "application/json",
              },
            }
          );

          const content = response.data.choices[0]?.message?.content;
          if (!content) {
            throw new Error("No response from Mistral API");
          }

          return JSON.parse(content);
        } catch (error) {
          console.error("Error generating summary:", error);
          return {
            summary: "Great effort! Review the correct answers above to improve.",
            improvementTips: "Focus on the specific terms you missed."
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
