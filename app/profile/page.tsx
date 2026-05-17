import { auth0 } from "@/lib/auth0";
import Link from "next/link";
import { User, LogIn } from "lucide-react";

export default async function ProfilePage() {
  // Check if user is authenticated using the Auth0 SDK
  const session = await auth0.getSession();

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-sm max-w-lg mx-auto">
          <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Authentication Required</h1>
          <p className="text-gray-500 mb-8">You must be signed in to view this page. Please log in or sign up to continue.</p>
          <a 
            href="/auth/login" 
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Sign In / Sign Up
          </a>
        </div>
      </div>
    );
  }

  // User is authenticated
  const { user } = session;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">User Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account details and view your session data.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-8 flex items-center gap-6 border-b border-gray-100">
          {user.picture ? (
            <img src={user.picture} alt={user.name} className="w-24 h-24 rounded-full border-4 border-gray-50 shadow-sm" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-gray-50 shadow-sm">
              <User className="w-10 h-10 text-blue-600" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name || user.nickname || 'Authenticated User'}</h2>
            <p className="text-gray-500">{user.email}</p>
            <span className="inline-block mt-2 bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full">
              ✓ Active Session
            </span>
          </div>
        </div>
        
        <div className="p-8 bg-gray-50">
          <h3 className="font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">Raw Session Data</h3>
          <pre className="bg-gray-900 text-green-400 p-6 rounded-xl text-xs font-mono overflow-auto shadow-inner border border-gray-800">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
