import React from "react";
import { ArrowLeft, Sparkles, Palette, Heart, Star } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface MakeupAIProps {
  onNavigate: (page: string) => void;
}

export function MakeupAI({ onNavigate }: MakeupAIProps) {
  return (
    <div className="pb-24 min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-3">
          <button onClick={() => onNavigate("dashboard")}>
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1>MakeupAI</h1>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-[50vh] overflow-hidden">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1491233670471-398d873b5406?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWtldXAlMjBiZWF1dHklMjBlbGVnYW50fGVufDF8fHx8MTc2MDc3NDY5Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Makeup"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
          <div className="px-6 pb-8 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500 mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Coming Soon</span>
            </div>
            <h1 className="text-white mb-2">Confidence is the New Makeup.</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Intro */}
          <div className="mb-12">
            <p className="text-xl text-gray-700 mb-4">
              Coming soon — your AI makeup artist who knows your skin tone,
              outfit, and occasion — before you even open your kit.
            </p>
          </div>

          {/* Problem Section */}
          <div className="bg-rose-50 border-l-4 border-rose-500 rounded-r-2xl p-6 mb-8">
            <h2 className="mb-4 text-rose-900">The Problem</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-3">
              Ever tried 10 tutorials and still felt it doesn't suit your skin?
            </p>
            <p className="text-gray-700 text-lg leading-relaxed">
              Makeup should feel natural — not like a mask.
            </p>
          </div>

          {/* Solution Section */}
          <div className="bg-purple-50 border-l-4 border-purple-500 rounded-r-2xl p-6 mb-12">
            <h2 className="mb-4 text-purple-900">The Solution</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              MakeupAI will understand your unique tone, face shape, and vibe.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              It'll guide you — what color enhances your glow, what look fits
              your day — effortlessly.
            </p>
            <p className="text-gray-700 text-lg leading-relaxed italic">
              No filters, no fakeness, just you — enhanced.
            </p>
          </div>

          {/* Features Preview */}
          <div className="mb-12">
            <h2 className="mb-6 text-center">What to Expect</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Palette className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="mb-2">Skin Analysis</h3>
                <p className="text-gray-600">
                  AI understands your skin tone, undertone, and type
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="mb-2">Occasion Match</h3>
                <p className="text-gray-600">
                  Get makeup looks perfect for your event and outfit
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="mb-2">Natural Glow</h3>
                <p className="text-gray-600">
                  Enhance your natural beauty, not hide it
                </p>
              </div>
            </div>
          </div>

          {/* Tagline */}
          <div className="text-center py-8 px-6 bg-gradient-to-r from-rose-50 to-purple-50 rounded-2xl mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="text-gray-900">Coming Soon</h3>
            </div>
            <p className="text-gray-700 text-lg italic">
              Because every face deserves its perfect glow.
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
              Stay Beautiful
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
