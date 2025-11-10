import React from "react";
import { RefreshCw } from "lucide-react";
import { X, Clock } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface HistoryEntry {
  prompt: string;
  reply: string;
  timestamp: string;
  selected_item_ids: string[];
}

interface WardrobeHistoryProps {
  entries: HistoryEntry[];
  onClose: () => void;
  onRestoreOutfit: (entry: HistoryEntry) => void;
  loading?: boolean;
  error?: string | null;
}

export const WardrobeHistory: React.FC<WardrobeHistoryProps> = ({
  entries,
  onClose,
  onRestoreOutfit,
  loading,
  error,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="bg-white w-full max-w-4xl h-full  flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold">Outfit History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <RefreshCw className="mx-auto w-8 h-8 animate-spin text-purple-600" />
              <p className="mt-4">Loading history…</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p className="font-medium">Unable to load history</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No outfit history yet</p>
              <p className="text-sm mt-2">
                Generate some outfits to see them here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry, index) => (
                <Card
                  key={index}
                  className="p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {entry.timestamp}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 mb-1">
                        {entry.prompt}
                      </p>
                      <p className="text-sm text-gray-600 mb-3">
                        {entry.reply}
                      </p>
                      {entry.selected_item_ids.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {entry.selected_item_ids.length} item(s) selected
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => onRestoreOutfit(entry)}
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Restore
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
