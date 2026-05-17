import { auth0 } from "@/lib/auth0";
import { ArrowRight, Briefcase, FileText, Bot, ShieldCheck } from "lucide-react";

export default async function LandingPage() {
  const session = await auth0.getSession();

  return (
    <div className="bg-white min-h-screen -mt-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-50 to-white pt-24 pb-20 px-6 border-b border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-sm font-bold mb-6">
            <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
            v0.4 Prototype Live
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6">
            Land your next role with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">AI Precision.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Job Pilot is your personal command center for managing parallel job tracks. Automatically parse JDs, instantly tailor your master resume, and prep for interviews using your own STAR stories.
          </p>
          
          <div className="flex justify-center gap-4">
            {session ? (
              <a 
                href="/dashboard" 
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Go to Dashboard <ArrowRight className="w-5 h-5" />
              </a>
            ) : (
              <a 
                href="/auth/login?returnTo=/dashboard" 
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Sign In to Get Started <ArrowRight className="w-5 h-5" />
              </a>
            )}
            <a 
              href="https://github.com" 
              target="_blank" 
              className="inline-flex items-center gap-2 bg-white text-gray-700 border-2 border-gray-200 px-8 py-4 rounded-xl font-bold text-lg hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              View Documentation
            </a>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Everything you need for the hunt</h2>
          <p className="text-gray-500 max-w-2xl mx-auto">Stop managing text files and spreadsheets. Job Pilot brings your resume, your stories, and your pipeline into one intelligent workflow.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Pipeline Tracking</h3>
            <p className="text-gray-600 leading-relaxed">Paste a Job Description URL and let the LLM extract the details. Track status, salary, and notes in a unified Kanban-style list.</p>
          </div>
          
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI Resume Tailoring</h3>
            <p className="text-gray-600 leading-relaxed">Map your master resume to specific job descriptions. The AI automatically rewrites your bullets to emphasize matching competencies.</p>
          </div>
          
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Story Bank Prep</h3>
            <p className="text-gray-600 leading-relaxed">Maintain a central repository of your STAR achievements. Generate custom interview prep guides surfaced by AI relevance.</p>
          </div>
        </div>
      </div>
      
      {/* Footer / Trust */}
      <div className="bg-gray-900 text-white py-16 text-center">
        <div className="flex justify-center mb-6 text-gray-400">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Securely integrated with Auth0</h2>
        <p className="text-gray-400 max-w-lg mx-auto">Your career data is private. Job Pilot uses enterprise-grade authentication via Auth0 Next.js SDK to ensure your information stays yours.</p>
      </div>
    </div>
  );
}
