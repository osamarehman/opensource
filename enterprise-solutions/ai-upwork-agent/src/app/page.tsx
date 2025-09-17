import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  const { userId } = await auth();

  // If user is authenticated, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Upwork
            <span className="text-blue-600"> Automation Platform</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Discover jobs intelligently, generate winning proposals with AI,
            research clients thoroughly, and track your performance—all in one
            enterprise-grade platform.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Smart Job Discovery</h3>
              <p className="text-gray-600">
                AI-powered filtering and scoring to find the perfect opportunities
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">AI Proposal Generation</h3>
              <p className="text-gray-600">
                Generate personalized, winning proposals that match your voice
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Performance Analytics</h3>
              <p className="text-gray-600">
                Track success rates and optimize your freelancing strategy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
