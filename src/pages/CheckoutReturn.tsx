import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6 bg-card border border-border rounded-xl p-10">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-heading text-3xl text-foreground">
          {sessionId ? "Payment complete" : "Checkout closed"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {sessionId
            ? "Thank you for subscribing to RinVita. Your account has been upgraded."
            : "No payment was processed."}
        </p>
        <Link
          to="/app"
          className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Return to your vault
        </Link>
      </div>
    </div>
  );
}
