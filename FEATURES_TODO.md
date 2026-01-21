# Anatomy Practice App - Feature Implementation TODO

## Phase 1: Question Shuffling
- [ ] Add shuffle function to randomize question order
- [ ] Shuffle questions when starting a new category
- [ ] Ensure shuffle happens every time, not just once
- [ ] Test that same questions appear but in different order

## Phase 2: Enhanced Navigation
- [ ] Add back button from quiz to category selection
- [ ] Add back button from category selection to mode selection
- [ ] Preserve state when navigating back
- [ ] Test full navigation flow: quiz → categories → mode → quiz

## Phase 3: Mid-Quiz Model Switching
- [ ] Add AI model dropdown in quiz header (visible during quiz)
- [ ] Allow changing model without losing progress
- [ ] Update validation to use newly selected model
- [ ] Test model switching mid-quiz

## Phase 4: Results Roundup
- [ ] Create results screen after completing a category
- [ ] Show list of questions with correct/incorrect status
- [ ] Display user's answer vs correct answer for wrong questions
- [ ] Add "Next Category" button to proceed to next module
- [ ] Add "Back to Categories" button

## Phase 5: AI Summary for Results
- [ ] Create backend endpoint for generating AI summary
- [ ] Pass all wrong answers to AI for analysis
- [ ] Generate personalized improvement suggestions
- [ ] Display AI summary prominently on results screen

## Phase 6: Module Completion Tracking
- [ ] Track which categories have been completed
- [ ] Store completion data in localStorage
- [ ] Show checkmarks or badges on completed modules
- [ ] Display completion percentage

## Phase 7: General Practice Mode (Missed Questions)
- [ ] Track all missed questions across all modules
- [ ] Create "Review Missed Questions" mode
- [ ] Aggregate missed questions from all categories
- [ ] Shuffle missed questions together
- [ ] Show which module each question came from
- [ ] Clear missed questions after getting them correct

## Testing
- [ ] Test question shuffling works every time
- [ ] Test all navigation paths
- [ ] Test model switching mid-quiz
- [ ] Test results roundup displays correctly
- [ ] Test AI summary generation
- [ ] Test module completion tracking
- [ ] Test general practice mode with missed questions from multiple modules
