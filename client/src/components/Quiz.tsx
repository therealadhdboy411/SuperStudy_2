import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, RotateCcw, Check, X, Loader2 } from "lucide-react";
import { allQuizData, QuizQuestion } from "@/lib/quizData";
import { trpc } from "@/lib/trpc";

interface QuizState {
  currentIndex: number;
  userAnswer: string;
  submitted: boolean;
  isCorrect: boolean | null;
  score: number;
  totalAnswered: number;
  selectedCategory: string | null;
  showImages: boolean;
  mode: "mode-select" | "practice" | "exam";
  selectedModel: "ministral-3" | "mistral-small" | "magistral-small" | "mistral-medium" | "magistral-medium" | "mistral-large";
  showWelcome: boolean;
  shuffledQuestions: QuizQuestion[];
}

export default function Quiz() {
  const [state, setState] = useState<QuizState>({
    currentIndex: 0,
    userAnswer: "",
    submitted: false,
    isCorrect: null,
    score: 0,
    totalAnswered: 0,
    selectedCategory: null,
    showImages: true,
    mode: "mode-select",
    selectedModel: "mistral-medium",
    showWelcome: true,
    shuffledQuestions: [],
  });

  // Shuffle array function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    return shuffled;
  };

  // Check localStorage to see if user has seen welcome before
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("anatomy-app-welcome-seen");
    if (hasSeenWelcome) {
      setState((prev) => ({ ...prev, showWelcome: false }));
    }
  }, []);

  // Filter questions by category if selected
  const filteredQuestions = useMemo(() => {
    if (!state.selectedCategory) return allQuizData;
    return allQuizData.filter((q) => q.category === state.selectedCategory);
  }, [state.selectedCategory]);

  // Use shuffled questions if available, otherwise use filtered questions
  const questionsToUse = state.shuffledQuestions.length > 0 ? state.shuffledQuestions : filteredQuestions;

  // Get unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(allQuizData.map((q) => q.category)));
  }, []);

  const currentQuestion = questionsToUse[state.currentIndex];
  const progress = ((state.currentIndex + 1) / questionsToUse.length) * 100;

  const handleAnswerChange = (value: string) => {
    setState((prev) => ({ ...prev, userAnswer: value, showImages: prev.showImages }));
  };

  const validateAnswerMutation = trpc.quiz.validateAnswer.useMutation();
  const [validationFeedback, setValidationFeedback] = useState<{
    feedback: string;
    hint: string;
  } | null>(null);

  const handleSubmit = async () => {
    if (!state.userAnswer.trim()) return;

    try {
      const result = await validateAnswerMutation.mutateAsync({
        userAnswer: state.userAnswer.trim(),
        correctAnswer: currentQuestion.answer,
        question: currentQuestion.question,
        category: state.selectedCategory || "",
        model: state.selectedModel,
      });

      setValidationFeedback({
        feedback: result.feedback,
        hint: result.hint,
      });

      setState((prev) => ({
        ...prev,
        submitted: true,
        isCorrect: result.isCorrect,
        score: result.isCorrect ? prev.score + 1 : prev.score,
        totalAnswered: prev.totalAnswered + 1,
      }));
    } catch (error) {
      console.error("Validation error:", error);
      // Fallback to simple string matching
      const isCorrect =
        state.userAnswer.toLowerCase().trim() ===
        currentQuestion.answer.toLowerCase().trim();

      setValidationFeedback({
        feedback: isCorrect ? "Great job!" : `The correct answer is "${currentQuestion.answer}"`,
        hint: "Try again!",
      });

      setState((prev) => ({
        ...prev,
        submitted: true,
        isCorrect,
        score: isCorrect ? prev.score + 1 : prev.score,
        totalAnswered: prev.totalAnswered + 1,
      }));
    }
  };

  const handleNext = () => {
    if (state.currentIndex < questionsToUse.length - 1) {
      setState((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        userAnswer: "",
        submitted: false,
        isCorrect: null,
        showImages: prev.showImages,
      }));
    }
  };

  const handlePrevious = () => {
    if (state.currentIndex > 0) {
      setState((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex - 1,
        userAnswer: "",
        submitted: false,
        isCorrect: null,
        showImages: prev.showImages,
      }));
    }
  };

  const handleReset = () => {
    setState({
      currentIndex: 0,
      userAnswer: "",
      submitted: false,
      isCorrect: null,
      score: 0,
      totalAnswered: 0,
      selectedCategory: null,
      showImages: true,
      mode: "mode-select",
      selectedModel: "mistral-medium",
      showWelcome: false,
      shuffledQuestions: [],
    });
  };

  const handleCategorySelect = (category: string, mode: "practice" | "exam" = "practice") => {
    // Filter and shuffle questions for the selected category
    const categoryQuestions = allQuizData.filter((q) => q.category === category);
    const shuffled = shuffleArray(categoryQuestions);
    
    setState({
      currentIndex: 0,
      userAnswer: "",
      submitted: false,
      isCorrect: null,
      score: 0,
      totalAnswered: 0,
      selectedCategory: category,
      showImages: true,
      mode,
      selectedModel: state.selectedModel,
      showWelcome: false,
      shuffledQuestions: shuffled,
    });
  };

  const handleToggleImages = () => {
    setState((prev) => ({
      ...prev,
      showImages: !prev.showImages,
    }));
  };

  // Show welcome modal on first visit
  if (state.showWelcome) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <h1 className="text-3xl font-bold text-primary mb-6">Welcome to Anatomy Terms Practice! 📚</h1>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">How to Use This App</h2>
                <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                  <li><span className="font-semibold text-foreground">Choose a Mode:</span> Practice Mode (with hints) or Exam Mode (no hints, realistic simulation)</li>
                  <li><span className="font-semibold text-foreground">Select a Category:</span> Pick from Body Planes, Directional Terms, Organ Systems, Specific Organs, or Histology</li>
                  <li><span className="font-semibold text-foreground">Choose an AI Model:</span> Select which Mistral model to use for answer validation</li>
                  <li><span className="font-semibold text-foreground">Answer Questions:</span> Fill in the blank with anatomical terms based on the images</li>
                  <li><span className="font-semibold text-foreground">Get Feedback:</span> AI validates your answer and provides explanations</li>
                </ol>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">AI Model Benefits</h2>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-background rounded border border-border">
                    <p className="font-semibold text-foreground">⚡ Instant (Ministral 3)</p>
                    <p className="text-muted-foreground">Fastest responses, great for quick practice sessions. Best for building speed and confidence.</p>
                  </div>
                  <div className="p-3 bg-background rounded border border-border">
                    <p className="font-semibold text-foreground">🚀 Fast (Mistral Small)</p>
                    <p className="text-muted-foreground">Quick and accurate. Good balance for studying without long wait times.</p>
                  </div>
                  <div className="p-3 bg-background rounded border border-border">
                    <p className="font-semibold text-foreground">🧠 Fast Thinking (Magistral Small)</p>
                    <p className="text-muted-foreground">Thoughtful analysis with quick responses. Better reasoning for complex anatomy questions.</p>
                  </div>
                  <div className="p-3 bg-background rounded border border-border">
                    <p className="font-semibold text-foreground">⚖️ Balanced (Mistral Medium) - Default</p>
                    <p className="text-muted-foreground">Perfect balance between speed and accuracy. Recommended for most study sessions.</p>
                  </div>
                  <div className="p-3 bg-background rounded border border-border">
                    <p className="font-semibold text-foreground">🎯 Balanced Thinking (Magistral Medium)</p>
                    <p className="text-muted-foreground">Deep reasoning with moderate speed. Excellent for understanding complex anatomical relationships.</p>
                  </div>
                  <div className="p-3 bg-background rounded border border-border">
                    <p className="font-semibold text-foreground">🧬 Intelligent (Mistral Large)</p>
                    <p className="text-muted-foreground">Most powerful model. Best for detailed feedback and nuanced anatomical explanations. Slower but most thorough.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-900 text-sm"><span className="font-semibold">💡 Tip:</span> Use Instant/Fast models for quick practice, and Intelligent for detailed study sessions before your Thursday lab practical.</p>
              </div>
            </div>

            <button
              onClick={() => {
                setState((prev) => ({ ...prev, showWelcome: false }));
                localStorage.setItem("anatomy-app-welcome-seen", "true");
              }}
              className="w-full mt-6 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-all"
            >
              Get Started →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show mode selection
  if (state.mode === "mode-select") {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <h1 className="text-4xl font-bold text-primary mb-2">Anatomy Terms Practice</h1>
            <p className="text-muted-foreground mb-12 text-lg">Choose a mode to get started:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="p-8 bg-card border-2 border-blue-300 rounded-lg hover:shadow-lg transition-all">
                <h2 className="text-2xl font-bold text-blue-600 mb-4">📚 Practice Mode</h2>
                <p className="text-muted-foreground mb-6">Learn with hints and immediate feedback. Perfect for studying and building confidence.</p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>✓ Hints provided after submission</li>
                  <li>✓ AI feedback on your answers</li>
                  <li>✓ Can review answers</li>
                  <li>✓ No time pressure</li>
                </ul>
                <button
                  onClick={() => setState((prev) => ({ ...prev, mode: "practice", selectedCategory: null }))}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                >
                  Start Practice Mode
                </button>
              </div>

              <div className="p-8 bg-card border-2 border-red-300 rounded-lg hover:shadow-lg transition-all">
                <h2 className="text-2xl font-bold text-red-600 mb-4">🧪 Exam Mode</h2>
                <p className="text-muted-foreground mb-6">Simulate the real lab practical. No hints, just you and the images. Get your final score at the end.</p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>✓ No hints or feedback during quiz</li>
                  <li>✓ Realistic lab practical simulation</li>
                  <li>✓ Final score revealed at end</li>
                  <li>✓ Perfect for test prep</li>
                </ul>
                <button
                  onClick={() => setState((prev) => ({ ...prev, mode: "exam", selectedCategory: null }))}
                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
                >
                  Start Exam Mode
                </button>
              </div>
            </div>

            <div className="p-6 bg-secondary/10 border border-secondary rounded-lg">
              <h3 className="text-lg font-semibold text-foreground mb-3">Lab Practical Tips</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="font-semibold text-foreground">Identify:</span> Look at the image and identify the structure</li>
                <li><span className="font-semibold text-foreground">Location:</span> Know where it\'s found in the body</li>
                <li><span className="font-semibold text-foreground">Function:</span> Understand what it does</li>
                <li><span className="font-semibold text-foreground">Spelling:</span> Minor errors are okay, but it must be recognizable</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show category selection
  if (!state.selectedCategory) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <h1 className="text-4xl font-bold text-primary mb-2">
              Anatomy Terms Practice
            </h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Master anatomical terminology with fill-in-the-blank questions and
              real anatomical images. Select a category to begin.
            </p>

            <div className="mb-6 p-4 bg-card border border-border rounded-lg">
              <label className="block text-sm font-semibold text-foreground mb-2">
                AI Model for Validation:
              </label>
              <select
                value={state.selectedModel}
                onChange={(e) => setState((prev) => ({...prev, selectedModel: e.target.value as any}))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ministral-3">Instant: Ministral 3 (14B)</option>
                <option value="mistral-small">Fast: Mistral Small</option>
                <option value="magistral-small">Fast Thinking: Magistral Small</option>
                <option value="mistral-medium">Balanced: Mistral Medium</option>
                <option value="magistral-medium">Balanced Thinking: Magistral Medium</option>
                <option value="mistral-large">Intelligent: Mistral Large</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => {
                const categoryCount = allQuizData.filter(
                  (q) => q.category === category
                ).length;
                return (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category, state.mode as "practice" | "exam")}
                    className="p-6 bg-card border border-border rounded-lg hover:border-primary hover:shadow-md transition-all text-left"
                  >
                    <h3 className="text-xl font-semibold text-primary mb-2">
                      {category}
                    </h3>
                    <p className="text-muted-foreground">
                      {categoryCount} questions
                    </p>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setState((prev) => ({ ...prev, mode: "mode-select", selectedCategory: null }))}
              className="mt-6 w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
            >
              Back to Mode Selection
            </button>

            {state.mode === "exam" && (
              <div className="mt-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                <p className="text-red-800 font-semibold">🧪 EXAM MODE: No hints or feedback until you submit. This simulates the real lab practical!</p>
              </div>
            )}

            {state.mode === "practice" && (
              <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <p className="text-blue-800 font-semibold">📚 PRACTICE MODE: Hints and feedback available after each answer.</p>
              </div>
            )}

            <div className="mt-12 p-6 bg-secondary/10 border border-secondary rounded-lg">
              <h2 className="text-lg font-semibold text-foreground mb-3">
                How to Use This App
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>Select a category to practice specific anatomy topics</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>
                    Read the question and view the anatomical images provided
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>
                    Fill in the blank with the correct anatomical term
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">4.</span>
                  <span>
                    Submit your answer and check if it&apos;s correct
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">5.</span>
                  <span>
                    Navigate through all questions to complete the category
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <h2 className="text-3xl font-bold text-primary mb-4">
            Quiz Complete!
          </h2>
          <div className="mb-6">
            <div className="text-5xl font-bold text-accent mb-2">
              {state.score}/{state.totalAnswered}
            </div>
            <p className="text-muted-foreground">
              You got{" "}
              {Math.round((state.score / state.totalAnswered) * 100)}% correct
            </p>
          </div>
          <Button
            onClick={handleReset}
            className="w-full bg-primary hover:bg-primary/90"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-primary">
              {state.selectedCategory}
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggleImages}
                className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                  state.showImages
                    ? "bg-primary text-white"
                    : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                }`}
              >
                {state.showImages ? "Hide Images" : "Show Images"}
              </button>
              <div className="text-sm text-muted-foreground">
                Question {state.currentIndex + 1} of {filteredQuestions.length}
              </div>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Images Section */}
            {state.showImages && (
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
                    Reference Images
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.images.map((image, idx) => (
                      <div
                        key={idx}
                        className="bg-muted rounded-lg overflow-hidden border border-border"
                      >
                        <img
                          src={image}
                          alt={`Reference ${idx + 1}`}
                          className="w-full h-64 object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Question Section */}
            <div className={state.showImages ? "lg:col-span-1" : "lg:col-span-3"}>
              <Card className={`p-6 ${state.showImages ? "sticky top-4" : "max-w-2xl mx-auto w-full"}`}>
                <h2 className="text-lg font-semibold text-foreground mb-6">
                  {currentQuestion.question}
                </h2>

                {/* Answer Input */}
                <div className="mb-6">
                  <Input
                    type="text"
                    placeholder="Type your answer..."
                    value={state.userAnswer}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    disabled={state.submitted}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !state.submitted) {
                        handleSubmit();
                      }
                    }}
                    className="mb-3"
                  />

                  {!state.submitted ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={!state.userAnswer.trim() || validateAnswerMutation.isPending}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      {validateAnswerMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        "Submit Answer"
                      )}
                    </Button>
                  ) : (
                    <div
                      className={`p-3 rounded-lg flex items-center gap-2 ${
                        state.isCorrect
                          ? "bg-green-100 border-2 border-green-500 text-green-700"
                          : "bg-red-100 border-2 border-red-500 text-red-700"
                      }`}
                    >
                      {state.isCorrect ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span className="font-semibold">Correct!</span>
                        </>
                      ) : (
                        <>
                          <X className="w-5 h-5" />
                          <span className="font-semibold">Incorrect</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Show Answer After Submission */}
                {state.submitted && !state.isCorrect && (
                  <div className="mb-6 p-4 bg-muted rounded-lg border border-border">
                    <p className="text-sm text-muted-foreground mb-2">
                      Correct answer:
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {currentQuestion.answer}
                    </p>
                  </div>
                )}

                {/* AI Feedback - Only in Practice Mode */}
                {state.submitted && validationFeedback && state.mode === "practice" && (
                  <>
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        Feedback:
                      </p>
                      <p className="text-sm text-blue-800">
                        {validationFeedback.feedback}
                      </p>
                    </div>

                    <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm font-semibold text-amber-900 mb-1">
                        Hint:
                      </p>
                      <p className="text-sm text-amber-800">
                        {validationFeedback.hint}
                      </p>
                    </div>
                  </>
                )}

                {/* Exam Mode - Show answer after submission */}
                {state.submitted && state.mode === "exam" && !state.isCorrect && (
                  <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      Correct Answer:
                    </p>
                    <p className="text-sm text-amber-800">
                      {currentQuestion.answer}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                {state.submitted && (
                  <div className="mb-6 p-4 bg-card border border-border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">
                      Score
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {state.score}/{state.totalAnswered}
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      {state.submitted && (
        <div className="bg-card border-t border-border p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Button
              onClick={handlePrevious}
              disabled={state.currentIndex === 0}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>

            {state.currentIndex === filteredQuestions.length - 1 ? (
              <Button
                onClick={handleReset}
                className="bg-primary hover:bg-primary/90"
                size="sm"
              >
                Finish
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90"
                size="sm"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
