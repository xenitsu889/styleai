import React from 'react';
import { ArrowLeft, Clock, Tag } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

export type Article = {
  id: number;
  title: string;
  category: string;
  readTime: string;
  image: string;
  excerpt: string;
  content: {
    intro: string;
    sections: {
      heading: string;
      text: string;
    }[];
    conclusion: string;
  };
};

interface ArticleReaderProps {
  article: Article;
  onBack: () => void;
}

export function ArticleReader({ article, onBack }: ArticleReaderProps) {
  return (
    <div className="pb-24 min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-3">
          <button onClick={onBack}>
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <div>
            <h1 className="text-slate-900">Article</h1>
          </div>
        </div>
      </div>

      {/* Article Hero Image */}
      <div className="relative h-64 md:h-96">
        <ImageWithFallback
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
      </div>

      {/* Article Content */}
      <div className="max-w-3xl mx-auto px-6 -mt-20 relative z-10">
        {/* Article Header */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-xl mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary" className="bg-amber-100 text-amber-900">
              <Tag className="w-3 h-3 mr-1" />
              {article.category}
            </Badge>
            <div className="flex items-center gap-1 text-slate-600 text-sm">
              <Clock className="w-4 h-4" />
              {article.readTime}
            </div>
          </div>
          
          <h1 className="text-slate-900 mb-4">{article.title}</h1>
          <p className="text-slate-600 text-lg leading-relaxed">{article.excerpt}</p>
        </div>

        {/* Article Body */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg mb-8">
          <div className="prose prose-slate max-w-none">
            {/* Introduction */}
            <p className="text-slate-700 text-lg leading-relaxed mb-8">
              {article.content.intro}
            </p>

            {/* Sections */}
            {article.content.sections.map((section, index) => (
              <div key={index} className="mb-8">
                <h2 className="text-slate-900 mb-4">{section.heading}</h2>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {section.text}
                </p>
              </div>
            ))}

            {/* Conclusion */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h2 className="text-slate-900 mb-4">Final Thoughts</h2>
              <p className="text-slate-700 leading-relaxed">
                {article.content.conclusion}
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mb-8">
          <Button
            onClick={onBack}
            variant="outline"
            className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Back to Articles
          </Button>
        </div>
      </div>
    </div>
  );
}
