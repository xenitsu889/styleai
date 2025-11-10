import React from "react";
import {
  ArrowLeft,
  User,
  Ruler,
  Users,
  UserCircle,
  Palette,
  Crown,
  Mail,
  Settings,
  LogOut,
  Edit2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { UserProfile } from "../App";

interface ProfileProps {
  userProfile: UserProfile;
  onNavigate: (page: string) => void;
  onEditProfile: () => void;
  onLogout: () => void;
  // when true, avoid showing action buttons (used while profile is loading)
  isLoading?: boolean;
}

export function Profile({
  userProfile,
  onNavigate,
  onEditProfile,
  onLogout,
  isLoading,
}: ProfileProps) {
  const profileFields = [
    { icon: User, label: "Name", value: userProfile.name || "Not set" },
    { icon: User, label: "Age", value: `${userProfile.age} years` },
    { icon: Ruler, label: "Height", value: `${userProfile.height} cm` },
    { icon: Users, label: "Gender", value: userProfile.gender },
    { icon: UserCircle, label: "Body Type", value: userProfile.bodyType },
    { icon: Palette, label: "Skin Tone", value: userProfile.skinTone },
    {
      icon: Crown,
      label: "Favourite Colours",
      value: userProfile.favouriteColours?.join(", ") || "Not set",
    },
    { icon: Mail, label: "Region", value: userProfile.region },
  ];

  return (
    <div className="pb-24 min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4 flex items-center gap-3">
          <button onClick={() => onNavigate("dashboard")}>
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-slate-900">Profile</h1>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-br from-slate-900 via-rose-900 to-amber-900 px-6 pt-12 pb-20">
        <div className="text-center">
          {userProfile.photo ? (
            <img
              src={userProfile.photo}
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-amber-100 shadow-lg mx-auto mb-4 object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-amber-100 shadow-lg mx-auto mb-4 bg-white flex items-center justify-center">
              <UserCircle className="w-16 h-16 text-slate-400" />
            </div>
          )}

          <h2 className="text-white">Your Style Profile</h2>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-6 -mt-12 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-900">Personal Information</h3>
            {!isLoading && (
              <Button
                onClick={onEditProfile}
                variant="outline"
                size="sm"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          <div className="space-y-4">
            {profileFields.map((field, index) => (
              <div
                key={index}
                className="flex items-center gap-4 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                  <field.icon className="w-5 h-5 text-slate-700" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-600 text-sm mb-1">{field.label}</p>
                  <p className="capitalize text-slate-900">{field.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Settings & Actions */}
      <div className="px-6">
        <Card className="divide-y divide-slate-100">
          {!isLoading && (
            <>
              <button
                onClick={() => alert("Email preferences feature coming soon!")}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-slate-900">Email Preferences</p>
                  <p className="text-slate-600 text-sm">Manage notifications</p>
                </div>
              </button>

              <button
                onClick={() =>
                  alert(
                    "App Preferences:\n\n• Theme: Light Mode\n• Language: English\n• Notifications: Enabled\n• Auto-save: On\n\nThese settings can be customized in future updates!"
                  )
                }
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-amber-700" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-slate-900">App Preferences</p>
                  <p className="text-slate-600 text-sm">
                    Customize your experience
                  </p>
                </div>
              </button>

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-colors"
              >
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-red-600">Log Out</p>
                  <p className="text-slate-600 text-sm">
                    Sign out of your account
                  </p>
                </div>
              </button>
            </>
          )}
        </Card>
      </div>

      {/* App Version */}
      <div className="px-6 mt-8 text-center text-gray-500 text-sm">
        <p>StylieAI v1.0.0</p>
        <p className="mt-1">India's First AI Fashion Ecosystem</p>
      </div>
    </div>
  );
}
