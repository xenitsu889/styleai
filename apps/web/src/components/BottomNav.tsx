import React from "react";
import { Home, Shirt, Wand2, BookOpen, User, Crown } from "lucide-react";
interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: "dashboard", icon: Home, label: "Home" },
    { id: "wardrobe", icon: Shirt, label: "Wardrobe" },
    { id: "assist", icon: Wand2, label: "Assist" },
    { id: "tips", icon: BookOpen, label: "Tips" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors relative ${
                isActive
                  ? "text-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon
                className={`w-6 h-6 ${
                  isActive ? "scale-110" : ""
                } transition-transform`}
              />
              <span className="text-xs">{item.label}</span>

              {isActive && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
