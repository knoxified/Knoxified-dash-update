const fs = require('fs');

const loginTsx = `"use client";

import { useState, useEffect, Suspense } from "react";
import { login } from "@/lib/actions/auth-actions";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  
  const [error, setError] = useState<string | null>(urlError);
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (urlError) {
      setError(urlError);
    }
  }, [urlError]);

  async function handleLogin(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
    }
    setIsPending(false);
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans text-slate-200 relative overflow-hidden bg-[#060A11]">
      {/* Global Animated Background Effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full bg-[#5CE1E6]/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-[#00A3FF]/10 blur-[150px] pointer-events-none" />

      {/* Left Branding Panel (Darker Glass) */}
      <div className="hidden md:flex flex-col w-1/2 bg-[#0A0D14]/80 backdrop-blur-3xl p-12 justify-between relative border-r border-white/5 z-10 shadow-[20px_0_40px_-10px_rgba(0,0,0,0.5)]">
        <div className="relative z-10">
          <div className="mb-12">
            <img src="/logo.png" alt="Knoxified Logo" className="h-32 w-auto object-contain drop-shadow-[0_0_15px_rgba(92,225,230,0.2)]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6 max-w-lg">
            Manage your Enterprise AI Systems with Precision.
          </h1>
          <p className="text-slate-400 text-lg max-w-md mb-4">
            The unified platform for orchestrating autonomous workflows, scaling voice agents, and driving compliance-first automation.
          </p>
          <p className="text-[#5CE1E6] text-sm tracking-widest uppercase font-semibold">"Think. Automate. Elevate"</p>
        </div>
        
        <div className="relative z-10 text-sm text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} Knoxified. All rights reserved.
        </div>
      </div>

      {/* Right Login Panel (Lighter Glass) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative bg-[#162032]/40 backdrop-blur-2xl z-10">
        <div className="w-full max-w-md space-y-8 relative z-10">
          
          {/* Mobile Branding (hidden on desktop) */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <img src="/logo.png" alt="Knoxified Logo" className="h-24 w-auto object-contain mb-4 drop-shadow-[0_0_15px_rgba(92,225,230,0.2)]" />
            <p className="text-[#5CE1E6] text-[11px] tracking-widest uppercase font-semibold">"Think. Automate. Elevate"</p>
          </div>

          <div className="bg-[#1C283F]/60 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A3FF] to-[#5CE1E6]" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#5CE1E6]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="mb-8 text-center md:text-left relative z-10">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-slate-400 font-medium">Please enter your details to sign in.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3 mb-6 relative z-10 backdrop-blur-sm">
                <div className="mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                </div>
                <p>{error}</p>
              </div>
            )}

            <form action={handleLogin} className="space-y-5 relative z-10">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-slate-300" htmlFor="email">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full bg-[#0B1120]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 focus:border-[#00D4FF] transition-all placeholder:text-slate-500 backdrop-blur-sm"
                  placeholder="name@company.com"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-300" htmlFor="password">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-sm text-[#00D4FF] hover:text-[#5CE1E6] font-semibold transition-colors drop-shadow-sm">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    required
                    className="w-full bg-[#0B1120]/50 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 focus:border-[#00D4FF] transition-all placeholder:text-slate-500 backdrop-blur-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-[#00A3FF] to-[#00D4FF] hover:from-[#0090E0] hover:to-[#00C0E0] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-[0_0_20px_rgba(0,163,255,0.3)] hover:shadow-[0_0_25px_rgba(0,163,255,0.4)]"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>

          <div className="pt-4 text-center md:text-left pl-2">
            <p className="text-slate-400 text-sm font-medium">
              Don't have an account?{" "}
              <a
                href="https://knoxified.org/get-started"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#00D4FF] hover:text-[#5CE1E6] font-bold transition-colors drop-shadow-sm"
              >
                Get Started
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060A11] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#00D4FF]" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
`;

const forgotTsx = `"use client";

import { useState } from "react";
import { resetPassword } from "@/lib/actions/auth-actions";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    
    try {
      const result = await resetPassword(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setIsSuccess(true);
      }
    } catch (e) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans text-slate-200 relative overflow-hidden bg-[#060A11]">
      {/* Global Animated Background Effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full bg-[#5CE1E6]/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-[#00A3FF]/10 blur-[150px] pointer-events-none" />

      {/* Left Branding Panel (Darker Glass) */}
      <div className="hidden md:flex flex-col w-1/2 bg-[#0A0D14]/80 backdrop-blur-3xl p-12 justify-between relative border-r border-white/5 z-10 shadow-[20px_0_40px_-10px_rgba(0,0,0,0.5)]">
        <div className="relative z-10">
          <div className="mb-12">
            <img src="/logo.png" alt="Knoxified Logo" className="h-32 w-auto object-contain drop-shadow-[0_0_15px_rgba(92,225,230,0.2)]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6 max-w-lg">
            Manage your Enterprise AI Systems with Precision.
          </h1>
          <p className="text-slate-400 text-lg max-w-md mb-4">
            The unified platform for orchestrating autonomous workflows, scaling voice agents, and driving compliance-first automation.
          </p>
          <p className="text-[#5CE1E6] text-sm tracking-widest uppercase font-semibold">"Think. Automate. Elevate"</p>
        </div>
        
        <div className="relative z-10 text-sm text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} Knoxified. All rights reserved.
        </div>
      </div>

      {/* Right Form Panel (Lighter Glass) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative bg-[#162032]/40 backdrop-blur-2xl z-10">
        <div className="w-full max-w-md space-y-8 relative z-10">
          
          <Link href="/login" className="inline-flex items-center text-sm font-semibold text-slate-400 hover:text-white transition-colors mb-4 bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 backdrop-blur-sm w-fit">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Link>

          {/* Mobile Branding (hidden on desktop) */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <img src="/logo.png" alt="Knoxified Logo" className="h-24 w-auto object-contain mb-4 drop-shadow-[0_0_15px_rgba(92,225,230,0.2)]" />
            <p className="text-[#5CE1E6] text-[11px] tracking-widest uppercase font-semibold">"Think. Automate. Elevate"</p>
          </div>

          <div className="bg-[#1C283F]/60 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A3FF] to-[#5CE1E6]" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#5CE1E6]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="mb-8 text-center md:text-left relative z-10">
              <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
              <p className="text-slate-400 font-medium">Enter your email and we'll send you a recovery link.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3 mb-6 relative z-10 backdrop-blur-sm">
                <div className="mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                </div>
                <p>{error}</p>
              </div>
            )}

            {isSuccess ? (
              <div className="bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-[#5CE1E6] p-6 rounded-xl text-center space-y-4 relative z-10 backdrop-blur-sm">
                <div className="flex justify-center">
                  <CheckCircle2 className="w-12 h-12 text-[#00D4FF]" />
                </div>
                <h3 className="font-bold text-xl text-white">Check your email</h3>
                <p className="text-sm font-medium">We sent a password recovery link. Please check your inbox and spam folder.</p>
              </div>
            ) : (
              <form action={handleSubmit} className="space-y-5 relative z-10">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-300" htmlFor="email">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full bg-[#0B1120]/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 focus:border-[#00D4FF] transition-all placeholder:text-slate-500 backdrop-blur-sm"
                    placeholder="name@company.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-gradient-to-r from-[#00A3FF] to-[#00D4FF] hover:from-[#0090E0] hover:to-[#00C0E0] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-[0_0_20px_rgba(0,163,255,0.3)] hover:shadow-[0_0_25px_rgba(0,163,255,0.4)]"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Send Recovery Link"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
`;

const resetTsx = `"use client";

import { useState } from "react";
import { updatePassword } from "@/lib/actions/auth-actions";
import { Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  
  const isValid = hasLength && hasUpper && hasLower && hasNumber && hasSpecial && passwordsMatch;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setError("Please ensure all password requirements are met.");
      return;
    }
    
    setIsPending(true);
    setError(null);
    
    try {
      const result = await updatePassword(password);
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = 'https://dashboard.knoxified.org/login';
        }, 3000);
      }
    } catch (e) {
      setError("An unexpected error occurred. Please try again or request a new link.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans text-slate-200 relative overflow-hidden bg-[#060A11]">
      {/* Global Animated Background Effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] rounded-full bg-[#5CE1E6]/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-[#00A3FF]/10 blur-[150px] pointer-events-none" />

      {/* Left Branding Panel (Darker Glass) */}
      <div className="hidden md:flex flex-col w-1/2 bg-[#0A0D14]/80 backdrop-blur-3xl p-12 justify-between relative border-r border-white/5 z-10 shadow-[20px_0_40px_-10px_rgba(0,0,0,0.5)]">
        <div className="relative z-10">
          <div className="mb-12">
            <img src="/logo.png" alt="Knoxified Logo" className="h-32 w-auto object-contain drop-shadow-[0_0_15px_rgba(92,225,230,0.2)]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6 max-w-lg">
            Manage your Enterprise AI Systems with Precision.
          </h1>
          <p className="text-slate-400 text-lg max-w-md mb-4">
            The unified platform for orchestrating autonomous workflows, scaling voice agents, and driving compliance-first automation.
          </p>
          <p className="text-[#5CE1E6] text-sm tracking-widest uppercase font-semibold">"Think. Automate. Elevate"</p>
        </div>
        
        <div className="relative z-10 text-sm text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} Knoxified. All rights reserved.
        </div>
      </div>

      {/* Right Form Panel (Lighter Glass) */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative bg-[#162032]/40 backdrop-blur-2xl z-10">
        <div className="w-full max-w-md space-y-8 relative z-10">
          
          {/* Mobile Branding (hidden on desktop) */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <img src="/logo.png" alt="Knoxified Logo" className="h-24 w-auto object-contain mb-4 drop-shadow-[0_0_15px_rgba(92,225,230,0.2)]" />
            <p className="text-[#5CE1E6] text-[11px] tracking-widest uppercase font-semibold">"Think. Automate. Elevate"</p>
          </div>

          <div className="bg-[#1C283F]/60 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00A3FF] to-[#5CE1E6]" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#5CE1E6]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="mb-8 text-center md:text-left relative z-10">
              <h2 className="text-3xl font-bold text-white mb-2">Set New Password</h2>
              <p className="text-slate-400 font-medium">Please choose a strong password to secure your account.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3 mb-6 relative z-10 backdrop-blur-sm">
                <div className="mt-0.5">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <p>{error}</p>
              </div>
            )}

            {isSuccess ? (
              <div className="bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-[#5CE1E6] p-6 rounded-xl text-center space-y-4 relative z-10 backdrop-blur-sm">
                <div className="flex justify-center">
                  <CheckCircle2 className="w-12 h-12 text-[#00D4FF]" />
                </div>
                <h3 className="font-bold text-xl text-white">Password Updated!</h3>
                <p className="text-sm font-medium">Your password has been successfully reset. Redirecting you to login...</p>
                <div className="pt-4">
                  <a href="https://dashboard.knoxified.org/login" className="text-[#00D4FF] font-bold hover:underline drop-shadow-sm">
                    Click here if not redirected
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-300" htmlFor="password">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#0B1120]/50 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 focus:border-[#00D4FF] transition-all placeholder:text-slate-500 backdrop-blur-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-300" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#0B1120]/50 border border-white/10 rounded-xl pl-4 pr-12 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-[#00D4FF]/50 focus:border-[#00D4FF] transition-all placeholder:text-slate-500 backdrop-blur-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="bg-[#0B1120]/60 backdrop-blur-sm p-4 rounded-xl border border-white/10 space-y-2 mt-4">
                  <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">Password requirements:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                    <div className={\`flex items-center gap-2 \${hasLength ? 'text-[#00D4FF] drop-shadow-sm' : 'text-slate-500'}\`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> 8+ characters
                    </div>
                    <div className={\`flex items-center gap-2 \${hasUpper ? 'text-[#00D4FF] drop-shadow-sm' : 'text-slate-500'}\`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Uppercase letter
                    </div>
                    <div className={\`flex items-center gap-2 \${hasLower ? 'text-[#00D4FF] drop-shadow-sm' : 'text-slate-500'}\`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Lowercase letter
                    </div>
                    <div className={\`flex items-center gap-2 \${hasNumber ? 'text-[#00D4FF] drop-shadow-sm' : 'text-slate-500'}\`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Number
                    </div>
                    <div className={\`flex items-center gap-2 \${hasSpecial ? 'text-[#00D4FF] drop-shadow-sm' : 'text-slate-500'}\`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Special character
                    </div>
                    <div className={\`flex items-center gap-2 \${passwordsMatch && confirmPassword ? 'text-[#00D4FF] drop-shadow-sm' : 'text-slate-500'}\`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending || !isValid}
                  className="w-full bg-gradient-to-r from-[#00A3FF] to-[#00D4FF] hover:from-[#0090E0] hover:to-[#00C0E0] text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-[0_0_20px_rgba(0,163,255,0.3)] hover:shadow-[0_0_25px_rgba(0,163,255,0.4)]"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Update Password"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('app/login/page.tsx', loginTsx);
fs.writeFileSync('app/forgot-password/page.tsx', forgotTsx);
fs.writeFileSync('app/reset-password/page.tsx', resetTsx);
