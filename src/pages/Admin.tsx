
import { FeedbackList } from "@/components/admin/FeedbackList";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function Admin() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8">
        <FeedbackList />
      </main>
      <Footer />
    </div>
  );
}
