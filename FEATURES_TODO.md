# Anatomy Practice App - Feature Implementation Roadmap

The following features have been requested to enhance the SuperStudy 2 experience.

## Phase 1: Question Shuffling (Priority: High)
*Objective: Prevent rote memorization by randomizing question order.*
- [ ] Add shuffle utility function (Fisher-Yates algorithm)
- [ ] Integrate shuffle into quiz initialization
- [ ] Ensure shuffle triggers on every new section start
- [ ] Verify randomization persists across restarts

## Phase 2: Enhanced Navigation (Priority: High)
*Objective: Improve user flow between quiz, modes, and menu.*
- [ ] Add "Exit Quiz" button in quiz header
- [ ] Implement breadcrumb or direct navigation: Quiz -> Mode Selection -> Main Menu
- [ ] Add confirmation dialog before exiting active quiz
- [ ] Ensure state cleanup on exit

## Phase 3: Mid-Quiz Model Switching
*Objective: Allow users to switch AI models dynamically.*
- [ ] Add model selector dropdown in quiz interface
- [ ] Implement state management for current AI model
- [ ] update API calls to use selected model immediately

## Phase 4: Results Roundup & AI Analysis
*Objective: Provide comprehensive feedback after practice.*
- [ ] Design Results Screen component
- [ ] Display "Correct" vs "Wrong" split
- [ ] **AI Integration**: Send wrong answers to backend for analysis
- [ ] Display AI summary: "Why you were wrong" and "Improvement tips"
- [ ] Add "Next Set" button for continuous workflow

## Phase 5: Continuous Workflow
*Objective: Reduce friction between study sets.*
- [ ] Add "Next Set" / "Next Category" button on Results screen
- [ ] Logic to determine next available uncompleted module

## Phase 6: Module Completion Tracking
*Objective: Visual progress indicators.*
- [ ] Persist completed modules in database/local storage
- [ ] Visual indicators (checkmarks/progress bars) on Dashboard
- [ ] "Resume" functionality for partial modules

## Phase 7: General Practice Mode (Quizlet Learn Style)
*Objective: Targeted practice for weak areas.*
- [ ] Track "missed questions" globally across all modules
- [ ] Create new "General Practice" mode
- [ ] Algorithm: Prioritize missed questions, then new ones
- [ ] Spaced repetition logic (optional but recommended)
