import { useState } from "react";
import { Plus, Trash2, ArrowLeft, Upload, Crown } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { WardrobeItem } from "../App";

interface WardrobeProps {
  items: WardrobeItem[];
  onAddItem: (item: WardrobeItem) => void;
  onDeleteItem: (id: string) => void;
  onNavigate: (page: string) => void;
  isLoading?: boolean;
}

export function Wardrobe({
  items,
  onAddItem,
  onDeleteItem,
  onNavigate,
  isLoading = false,
}: WardrobeProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({ category: "", name: "", image: "" });
  const [imagePreview, setImagePreview] = useState("");

  const canAddMore = true;

  const categories = [
    "Shirts",
    "T-Shirts",
    "Pants",
    "Jeans",
    "Jackets",
    "Dresses",
    "Skirts",
    "Shoes",
    "Accessories",
    "Others",
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setNewItem({ ...newItem, image: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = () => {
    if (newItem.category && newItem.name && newItem.image) {
      const item: WardrobeItem = {
        id: Date.now().toString(),
        ...newItem,
      };
      onAddItem(item);
      setNewItem({ category: "", name: "", image: "" });
      setImagePreview("");
      setIsDialogOpen(false);
    }
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, WardrobeItem[]>);

  return (
    <div className="pb-24 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate("dashboard")}>
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div>
              <h1>Digital Wardrobe</h1>
              <p className="text-gray-600 text-sm">{items.length} items</p>
            </div>
          </div>{" "}
          {canAddMore ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Wardrobe Item</DialogTitle>
                  <DialogDescription>
                    Upload a photo and add details of your clothing item
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value :any) =>
                        setNewItem({ ...newItem, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Blue Denim Jacket"
                      value={newItem.name}
                      onChange={(e) =>
                        setNewItem({ ...newItem, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="image">Photo</Label>
                    <div className="mt-2">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => {
                              setImagePreview("");
                              setNewItem({ ...newItem, image: "" });
                            }}
                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="image"
                          className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-purple-600 transition-colors"
                        >
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-gray-600 text-sm">
                            Click to upload photo
                          </span>
                          <input
                            id="image"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleAddItem}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={
                      !newItem.category || !newItem.name || !newItem.image
                    }
                  >
                    Add to Wardrobe
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-pulse mx-auto w-48 h-6 bg-gray-200 rounded mb-4" />
            <p className="text-gray-600">Loading wardrobe items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="mb-2">Your Wardrobe is Empty</h2>
            <p className="text-gray-600 mb-6">
              Start by adding your first clothing item
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Wardrobe Item</DialogTitle>
                  <DialogDescription>
                    Upload a photo and add details of your clothing item
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newItem.category}
                      onValueChange={(value:any) =>
                        setNewItem({ ...newItem, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Blue Denim Jacket"
                      value={newItem.name}
                      onChange={(e) =>
                        setNewItem({ ...newItem, name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="image">Photo</Label>
                    <div className="mt-2">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => {
                              setImagePreview("");
                              setNewItem({ ...newItem, image: "" });
                            }}
                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="image"
                          className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-purple-600 transition-colors"
                        >
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-gray-600 text-sm">
                            Click to upload photo
                          </span>
                          <input
                            id="image"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleAddItem}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={
                      !newItem.category || !newItem.name || !newItem.image
                    }
                  >
                    Add to Wardrobe
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category}>
                <h2 className="mb-4">{category}</h2>
                <div className="flex grid-cols-4 gap-4">
                  {categoryItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <div className="relative">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-auto h-48 object-cover"
                        />
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                      <div className="p-3">
                        <p className="truncate">{item.name}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
