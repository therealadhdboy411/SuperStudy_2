import { useAuth } from "@/_core/hooks/useAuth";
import Quiz from "@/components/Quiz";

/**
 * Anatomy Terms Practice App - Home Page
 * Clinical Precision Design Theme
 * - Deep teal primary color for medical authority
 * - Coral accent for positive reinforcement
 * - Clean, functional layout focused on learning
 */
export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  return <Quiz />;
}
