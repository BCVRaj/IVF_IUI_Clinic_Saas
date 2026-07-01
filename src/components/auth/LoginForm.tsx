'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import GoogleButton from './GoogleButton'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')
  const callbackError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [showPassword, setShowPassword] = useState(false)

  const validate = (): boolean => {
    const newErrors: typeof errors = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const result = await response.json()

      if (!response.ok) {
        setErrors({ general: result.error || 'Invalid email or password. Please try again.' })
        setIsLoading(false)
        return
      }

      if (!result.user) {
        setErrors({ general: 'Failed to retrieve user profile.' })
        setIsLoading(false)
        return
      }

      const role = result.user.role?.toUpperCase()
      if (!role) {
        setErrors({ general: 'Your account is not authorized.' })
        setIsLoading(false)
        return
      }

      let targetPath = redirectTo

      if (!targetPath || targetPath === '/' || targetPath.startsWith('/dashboard')) {
        if (role === 'PATIENT') {
          targetPath = '/patient'
        } else if (role === 'DOCTOR') {
          targetPath = '/doctor'
        } else if (role === 'NURSE') {
          targetPath = '/nurse'
        } else {
          setErrors({ general: 'Your account is not authorized.' })
          setIsLoading(false)
          router.push('/login')
          return
        }
      }

      router.push(targetPath)
      router.refresh()
    } catch (err: any) {
      setErrors({ general: err.message || 'An unexpected error occurred. Please try again.' })
      setIsLoading(false)
    }
  }


  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Welcome Back</h1>
        <p className="text-sm text-gray-500">Sign in to your account to continue</p>
      </div>

      {(errors.general || callbackError) && (
        <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{errors.general || 'Authentication failed. Please try again.'}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#0F172A] mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })) }}
            placeholder="you@example.com"
            autoComplete="email"
            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-[#0F172A] placeholder-gray-400 bg-white transition-colors duration-200 outline-none focus:ring-2 focus:ring-[#27257E]/20 focus:border-[#27257E] ${errors.email ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-[#E5E7EB]'}`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-[#0F172A]">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-medium text-[#27257E] hover:text-[#1e1c63] transition-colors">
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })) }}
              placeholder="Enter your password"
              autoComplete="current-password"
              className={`w-full px-3.5 py-2.5 pr-10 rounded-lg border text-sm text-[#0F172A] placeholder-gray-400 bg-white transition-colors duration-200 outline-none focus:ring-2 focus:ring-[#27257E]/20 focus:border-[#27257E] ${errors.password ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : 'border-[#E5E7EB]'}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-lg bg-[#27257E] text-white font-medium text-sm transition-all duration-200 hover:bg-[#1e1c63] focus:outline-none focus:ring-2 focus:ring-[#27257E]/50 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing in...
            </>
          ) : 'Sign In'}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#E5E7EB]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-white text-gray-400">Or</span>
        </div>
      </div>

      <GoogleButton />
    </div>
  )
}
