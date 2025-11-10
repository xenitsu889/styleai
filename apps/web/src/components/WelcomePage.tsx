import React, { useState } from "react";
import {
  Sparkles,
  Zap,
  Heart,
  Star,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface WelcomePageProps {
  onSignup: () => void;
}

export function WelcomePage({ onSignup }: WelcomePageProps) {
  const [currentScreen, setCurrentScreen] = useState(0);

  const nextScreen = () => {
    if (currentScreen < 2) {
      setCurrentScreen(currentScreen + 1);
    }
  };

  const prevScreen = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Screen 1: Hero Section */}
      {currentScreen === 0 && (
        <div className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-rose-900 to-amber-900 opacity-95" />
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1751399566412-ad1194241c5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHlsaXNoJTIwd29tYW4lMjBvdXRmaXR8ZW58MXx8fHwxNzYwNzA1ODA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Fashion"
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
          />

          <div className="relative z-10 text-center px-6 max-w-4xl flex-1 flex flex-col items-center justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-amber-300/30 mb-6">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="text-amber-50 text-sm">
                India's First AI Fashion Ecosystem
              </span>
            </div>

            <h1 className="text-white mb-6 tracking-tight">
              <span className="block text-5xl md:text-7xl mb-2">StylieAI</span>
              <span className="block text-2xl md:text-3xl opacity-90">
                Your Personal AI Fashion Stylist
              </span>
            </h1>

            <p className="text-white/80 mb-10 text-lg md:text-xl max-w-2xl mx-auto">
              Digitally organize your wardrobe, get AI-powered outfit
              suggestions, and talk to your personal fashion expert anytime
            </p>
          </div>

          {/* Navigation */}
          <div className="relative z-10 pb-12 flex items-center justify-center gap-4">
            <Button
              onClick={nextScreen}
              size="lg"
              className="bg-amber-100 text-slate-900 hover:bg-amber-200 px-8 py-6 text-lg shadow-2xl"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Progress Dots */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-300"></div>
            <div className="w-2 h-2 rounded-full bg-white/30"></div>
            <div className="w-2 h-2 rounded-full bg-white/30"></div>
          </div>
        </div>
      )}

      {/* Screen 2: Features Section */}
      {currentScreen === 1 && (
        <div className="min-h-screen flex flex-col bg-stone-50">
          <div className="flex-1 py-24 px-6 flex items-center justify-center">
            <div className="max-w-6xl mx-auto w-full">
              <div className="text-center mb-16">
                <h2 className="mb-4 text-slate-900">Why StylieAI?</h2>
                <p className="text-slate-600 text-lg">
                  Your complete fashion companion powered by AI
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-slate-100">
                  <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center mb-6">
                    <Sparkles className="w-7 h-7 text-slate-700" />
                  </div>
                  <h3 className="mb-3 text-slate-900">Digital Wardrobe</h3>
                  <p className="text-slate-600">
                    Upload and organize your entire wardrobe digitally. Never
                    forget what you own again.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-rose-100">
                  <div className="w-14 h-14 bg-gradient-to-br from-rose-100 to-rose-200 rounded-xl flex items-center justify-center mb-6">
                    <Zap className="w-7 h-7 text-rose-800" />
                  </div>
                  <h3 className="mb-3 text-slate-900">AI Outfit Generator</h3>
                  <p className="text-slate-600">
                    Get personalized outfit combinations from your existing
                    clothes powered by AI.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-amber-100">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center mb-6">
                    <Heart className="w-7 h-7 text-amber-800" />
                  </div>
                  <h3 className="mb-3 text-slate-900">Personal AI Stylist</h3>
                  <p className="text-slate-600">
                    Chat with your AI fashion expert for outfit advice, styling
                    tips, and more.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="pb-12 flex items-center justify-center gap-4">
            <Button
              onClick={prevScreen}
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <Button
              onClick={nextScreen}
              size="lg"
              className="bg-gradient-to-r from-slate-900 via-rose-900 to-amber-900 text-white hover:opacity-90 px-8 py-6 text-lg shadow-lg"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Progress Dots */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
            <div className="w-2 h-2 rounded-full bg-slate-900"></div>
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
          </div>
        </div>
      )}

      {/* Screen 3: CTA Section */}
      {currentScreen === 2 && (
        <div className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-rose-900 to-amber-900">
          <div className="relative z-10 flex-1 flex items-center justify-center px-6">
            <div className="max-w-4xl mx-auto text-center">
              <Star className="w-12 h-12 text-amber-300 mx-auto mb-6" />
              <h2 className="text-white mb-6">
                Ready to Transform Your Style?
              </h2>
              <p className="text-white/90 text-lg mb-10">
                Join thousands of fashion-forward individuals who trust StylieAI
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="relative z-10 pb-12 flex items-center justify-center gap-4">
            <Button
              onClick={prevScreen}
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg bg-white/10 border-amber-300/30 text-white hover:bg-white/20"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <Button
              onClick={onSignup}
              size="lg"
              className="bg-amber-100 text-slate-900 hover:bg-amber-200 px-8 py-6 text-lg shadow-2xl"
            >
              Get Started Free
            </Button>
          </div>

          {/* Progress Dots */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
            <div className="w-2 h-2 rounded-full bg-white/30"></div>
            <div className="w-2 h-2 rounded-full bg-white/30"></div>
            <div className="w-2 h-2 rounded-full bg-amber-300"></div>
          </div>
        </div>
      )}
    </div>
  );
}
