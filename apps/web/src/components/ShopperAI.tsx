import React from "react";
import {
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Target,
} from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ShopperAIProps {
  onNavigate: (page: string) => void;
}

export function ShopperAI({ onNavigate }: ShopperAIProps) {
  return (
    <div className="pb-24 min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-3">
          <button onClick={() => onNavigate("dashboard")}>
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1>ShopperAI</h1>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-[50vh] overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1759563871365-4b90aa1ddd5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaG9wcGluZyUyMGJhZ3MlMjBsdXh1cnl8ZW58MXx8fHwxNzYwNzc0NjkyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Shopping"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
          <div className="px-6 pb-8 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500 mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Coming Soon</span>
            </div>
            <h1 className="text-white mb-2">
              The Future of Shopping is Smart.
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Intro */}
          <div className="mb-12">
            <p className="text-xl text-gray-700 mb-4">
              Fed up of endless scrolling and confusion while shopping?
            </p>
            <p className="text-xl text-gray-700">
              Meet <span className="text-blue-600">ShopperAI</span> — your
              upcoming AI companion that curates, compares, and picks what suits{" "}
              <span className="italic">YOU</span>, not the crowd.
            </p>
          </div>

          {/* Problem Section */}
          <div className="bg-red-50 border-l-4 border-red-500 rounded-r-2xl p-6 mb-8">
            <h2 className="mb-4 text-red-900">The Problem</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              Every day, millions of people buy clothes they never wear. Choices
              are infinite, but satisfaction is rare.
            </p>
          </div>

          {/* Solution Section */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-2xl p-6 mb-12">
            <h2 className="mb-4 text-blue-900">The Solution</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              ShopperAI learns your vibe, your budget, your style — and finds
              the best match in seconds.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Shopping won't be a headache anymore. It'll be an experience built
              just for you.
            </p>
          </div>

          {/* Features Preview */}
          <div className="mb-12">
            <h2 className="mb-6 text-center">What to Expect</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="mb-2">Personalized</h3>
                <p className="text-gray-600">
                  Curated picks based on your unique style and preferences
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="mb-2">Smart Compare</h3>
                <p className="text-gray-600">
                  AI compares prices, quality, and reviews to find the best
                  deals
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="mb-2">Effortless</h3>
                <p className="text-gray-600">
                  No more endless scrolling. Get exactly what you need, fast
                </p>
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div className="text-center mb-8">
            <p className="text-gray-600 text-lg italic">
              India ka naya shopping dost
            </p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              size="lg"
              disabled
              className="bg-gray-400 cursor-not-allowed px-8 py-6"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Stay Tuned
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 pt-8 border-t">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
              <span>
                Powered by StylieAI — India's first AI Fashion Ecosystem
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
