"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { LocationMap } from '@/components/ui/expand-map';
interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  mode?: 'signin' | 'signup';
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  onToggleMode?: () => void;
  error?: string | null;
  success?: string | null;
  loading?: boolean;
}

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-[#649E97]/35 bg-[#F8FBFA] transition-colors focus-within:border-[#006B4E]/70 focus-within:bg-[#006B4E]/5">
    {children}
  </div>
);

export const SignInPage: React.FC<SignInPageProps> = ({
  title,
  description,
  heroImageSrc,
  mode = 'signin',
  onSubmit,
  onToggleMode,
  error,
  success,
  loading,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isSignUp = mode === 'signup';

  const defaultTitle = isSignUp
    ? <span style={{ fontFamily: 'var(--font-nanum-myeongjo)' }} className="font-bold text-foreground tracking-tighter">Join The Hunt</span>
    : <span style={{ fontFamily: 'var(--font-nanum-myeongjo)' }} className="font-bold text-foreground tracking-tighter">The Hunt</span>;

  const defaultDescription = isSignUp
    ? "Create your account and start discovering your perfect neighborhood"
    : "Sign in and find your perfect neighborhood";

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw]">
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6 rounded-xl bg-white/75 border border-[#649E97]/25 backdrop-blur-sm p-8">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
              {title || defaultTitle}
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">
              {description || defaultDescription}
            </p>

            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <GlassInputWrapper>
                  <input name="email" type="email" placeholder="Enter your email address" className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-muted-foreground">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              {error && <p className="animate-element text-sm text-red-500">{error}</p>}
              {success && <p className="animate-element text-sm text-green-500">{success}</p>}

              <button
                type="submit"
                disabled={loading}
                className="animate-element animate-delay-500 w-full rounded-2xl bg-[#006B4E] py-4 font-medium text-white hover:bg-[#006B4E]/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading…' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <p className="animate-element animate-delay-600 text-center text-sm text-muted-foreground">
              {isSignUp ? (
                <>Already have an account?{' '}<a href="#" onClick={(e) => { e.preventDefault(); onToggleMode?.(); }} className="text-[#006B4E] hover:underline transition-colors">Sign In</a></>
              ) : (
                <>New to our platform?{' '}<a href="#" onClick={(e) => { e.preventDefault(); onToggleMode?.(); }} className="text-[#006B4E] hover:underline transition-colors">Create Account</a></>
              )}
            </p>
          </div>
        </div>
      </section>

      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl overflow-hidden">
            <Image
              src={heroImageSrc}
              alt=""
              fill
              unoptimized
              className="object-cover object-center"
              priority
            />
            <div className="relative z-10 flex flex-col items-center justify-center h-full gap-8">
              <p className="text-neutral-600 text-xs font-medium tracking-[0.2em] uppercase">Currently In</p>
              <LocationMap location="Boston, MA" coordinates="42.3601° N, 71.0589° W" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
