import React from "react";
import {
  ArrowLeft,
  Crown,
  Check,
  Sparkles,
  Zap,
  MessageCircle,
  Upload,
  Wand2,
  Star,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

interface SubscriptionProps {
  isPro: boolean;
  onUpgrade: () => void;
  onNavigate: (page: string) => void;
}

export function Subscription({
  isPro,
  onUpgrade,
  onNavigate,
}: SubscriptionProps) {
  const freeFeatures = [
    { icon: Upload, text: "Up to 10 wardrobe items", included: true },
    { icon: Wand2, text: "2 AI outfit picks per day", included: true },
    { icon: Star, text: "Basic styling tips", included: true },
    { icon: MessageCircle, text: "AI Fashion Chat", included: false },
    { icon: Zap, text: "Unlimited wardrobe items", included: false },
    { icon: Sparkles, text: "Unlimited AI picks", included: false },
  ];

  const proFeatures = [
    { icon: Zap, text: "Unlimited wardrobe items" },
    { icon: Sparkles, text: "Unlimited AI outfit picks" },
    { icon: MessageCircle, text: "Unlimited AI Fashion Chat" },
    { icon: Wand2, text: "Advanced styling recommendations" },
    { icon: Star, text: "Priority customer support" },
    { icon: Crown, text: "Exclusive fashion insights" },
  ];

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-3">
          <button onClick={() => onNavigate("dashboard")}>
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1>Subscription Plans</h1>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white px-6 py-12 text-center">
        <Crown className="w-16 h-16 mx-auto mb-4" />
        <h1 className="text-white mb-3">Unlock Your Style Potential</h1>
        <p className="text-white/90 text-lg max-w-md mx-auto">
          Get unlimited access to AI-powered fashion advice and personalized
          styling
        </p>
      </div>

      {/* Plans */}
      <div className="px-6 py-8">
        {/* Free Plan */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="mb-1">Free Plan</h2>
              <p className="text-gray-600">Get started with basic features</p>
            </div>
            {!isPro && (
              <Badge className="bg-green-100 text-green-700 border-0">
                Current
              </Badge>
            )}
          </div>

          <div className="mb-6">
            <span className="text-4xl">₹0</span>
            <span className="text-gray-600">/month</span>
          </div>

          <div className="space-y-3 mb-6">
            {freeFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    feature.included ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  {feature.included ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <span className="text-gray-400 text-xs">✕</span>
                  )}
                </div>
                <span
                  className={
                    feature.included ? "text-gray-700" : "text-gray-400"
                  }
                >
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {!isPro && (
            <Button disabled variant="outline" className="w-full">
              Current Plan
            </Button>
          )}
        </Card>

        {/* Pro Plan */}
        <Card className="p-6 border-2 border-purple-600 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-bl from-yellow-400 to-orange-500 text-white px-4 py-1 text-sm rounded-bl-lg">
            Popular
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2>Pro Plan</h2>
                <Crown className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-gray-600">Unlock everything StylieAI offers</p>
            </div>
            {isPro && (
              <Badge className="bg-yellow-500 text-white border-0">
                Active
              </Badge>
            )}
          </div>

          <div className="mb-6">
            <span className="text-4xl">₹149</span>
            <span className="text-gray-600">/month</span>
            <p className="text-green-600 text-sm mt-1">
              Save ₹1,788/year vs daily premium picks
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {proFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-purple-600" />
                </div>
                <span className="text-gray-700">{feature.text}</span>
              </div>
            ))}
          </div>

          {isPro ? (
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-purple-900 mb-1">You're a Pro Member!</p>
              <p className="text-gray-600 text-sm">
                Enjoy unlimited access to all features
              </p>
            </div>
          ) : (
            <Button
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6"
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to Pro - ₹149/month
            </Button>
          )}
        </Card>

        {/* Features Comparison */}
        <div className="mt-12">
          <h2 className="mb-6 text-center">Why Go Pro?</h2>

          <div className="space-y-4">
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shrink-0">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="mb-2">Talk to Your AI Stylist Anytime</h3>
                  <p className="text-gray-600">
                    Get instant fashion advice, outfit suggestions, and styling
                    tips through unlimited AI chat conversations
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-pink-50 to-orange-50">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="mb-2">Unlimited Everything</h3>
                  <p className="text-gray-600">
                    No limits on wardrobe items, outfit picks, or AI
                    interactions. Your style journey, unlimited
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center shrink-0">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="mb-2">Premium Experience</h3>
                  <p className="text-gray-600">
                    Advanced recommendations, priority support, and exclusive
                    fashion insights tailored just for you
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Trust Section */}
        <div className="mt-12 text-center text-gray-600">
          <p className="text-sm mb-2">Cancel anytime. No hidden fees.</p>
          <p className="text-sm">
            Join thousands of fashion-forward individuals
          </p>
        </div>
      </div>
    </div>
  );
}
