import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Start creating amazing images with TextOverlayed
          </p>
        </div>
        <div className="bg-white/10 dark:bg-gray-900/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-800/50 p-6">
          <SignUp 
            redirectUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-none bg-transparent",
                headerTitle: "text-gray-900 dark:text-white",
                headerSubtitle: "text-gray-600 dark:text-gray-400",
                formButtonPrimary: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300",
                formFieldInput: "bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/50 backdrop-blur-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent",
                formFieldLabel: "text-gray-700 dark:text-gray-300",
                footerActionLink: "text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300",
                dividerLine: "bg-gray-300 dark:bg-gray-600",
                dividerText: "text-gray-500 dark:text-gray-400",
                socialButtonsBlockButton: "bg-white/50 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-gray-800/70",
                socialButtonsBlockButtonText: "text-gray-700 dark:text-gray-300",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
} 