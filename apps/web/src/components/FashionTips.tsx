import React, { useState } from "react";
import { ArrowLeft, BookOpen, TrendingUp, Heart, Sparkles } from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ArticleReader, Article } from "./ArticleReader";

interface FashionTipsProps {
  onNavigate: (page: string) => void;
}

export function FashionTips({ onNavigate }: FashionTipsProps) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const articles: Article[] = [
    {
      id: 1,
      title: "Building a Capsule Wardrobe",
      category: "Essentials",
      readTime: "5 min read",
      image:
        "https://images.unsplash.com/photo-1716307961085-6a7006f28685?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwd2FyZHJvYmUlMjBtb2Rlcm58ZW58MXx8fHwxNzYwNzc0NjkxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      excerpt:
        "Learn how to create a versatile wardrobe with just 30 essential pieces that work for every occasion.",
      content: {
        intro:
          "A capsule wardrobe is a curated collection of essential clothing items that can be mixed and matched to create numerous outfits. This minimalist approach to fashion not only simplifies your daily dressing routine but also helps you develop a signature style while reducing decision fatigue.",
        sections: [
          {
            heading: "What is a Capsule Wardrobe?",
            text: "A capsule wardrobe typically consists of 30-40 versatile pieces that work together seamlessly. These items are carefully selected to suit your lifestyle, body type, and personal style preferences. The concept was popularized by Susie Faux in the 1970s and has since become a cornerstone of minimalist fashion.\n\nThe beauty of a capsule wardrobe lies in its versatility. With fewer items, you can create more combinations and develop a cohesive personal style that truly reflects who you are.",
          },
          {
            heading: "Essential Pieces to Include",
            text: "Start with timeless basics: a well-fitted pair of jeans, tailored trousers, a white button-down shirt, a quality blazer, and a little black dress. Add neutral-colored t-shirts, a versatile sweater, and a classic coat.\n\nFor footwear, invest in three pairs: comfortable sneakers for casual days, classic pumps for formal occasions, and versatile ankle boots. These form the foundation that you can build upon with seasonal pieces and accessories.",
          },
          {
            heading: "Color Coordination Tips",
            text: "Choose a neutral color palette as your base: black, white, gray, navy, or beige. These colors are easy to mix and match and never go out of style. Then, add 2-3 accent colors that complement your skin tone and can be incorporated through accessories or statement pieces.\n\nThis approach ensures that almost everything in your wardrobe coordinates, making it easy to create polished outfits in minutes.",
          },
          {
            heading: "Quality Over Quantity",
            text: "When building a capsule wardrobe, invest in quality pieces that will last. Look for well-constructed garments with good stitching, quality fabrics, and classic cuts that won't date quickly.\n\nWhile quality items may cost more upfront, they last longer and often look better, making them more cost-effective in the long run. A well-made blazer or pair of trousers can serve you for years.",
          },
        ],
        conclusion:
          "Building a capsule wardrobe is a journey, not a destination. Start small, be intentional with your purchases, and don't be afraid to edit your collection as your style evolves. Remember, the goal is to create a wardrobe that makes you feel confident and makes getting dressed a joy rather than a chore.",
      },
    },
    {
      id: 2,
      title: "Color Theory for Fashion",
      category: "Styling",
      readTime: "7 min read",
      image:
        "https://images.unsplash.com/photo-1563721465742-cc3ead9deb36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbWFnYXppbmUlMjBtaW5pbWFsfGVufDF8fHx8MTc2MDc3NDY5Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      excerpt:
        "Master the art of color coordination and discover which colors complement your skin tone perfectly.",
      content: {
        intro:
          "Understanding color theory can transform your approach to fashion and help you create harmonious, eye-catching outfits. By learning which colors work together and which ones complement your unique features, you can elevate your style and feel more confident in your clothing choices.",
        sections: [
          {
            heading: "Understanding the Color Wheel",
            text: "The color wheel is your best friend when it comes to fashion. Primary colors (red, blue, yellow) combine to create secondary colors (green, orange, purple). Complementary colors sit opposite each other on the wheel and create striking contrasts when paired together.\n\nAnalogous colors sit next to each other on the wheel and create harmonious, pleasing combinations. Understanding these relationships helps you create outfits that are visually balanced and sophisticated.",
          },
          {
            heading: "Determining Your Skin Tone",
            text: "Skin tones generally fall into warm, cool, or neutral categories. Warm skin tones have yellow, peachy, or golden undertones and look best in earthy colors like olive, orange, and warm browns. Cool skin tones have pink, red, or blue undertones and are complemented by jewel tones and cool grays.\n\nTo determine your undertone, look at the veins on your wrist in natural light. Green veins suggest warm undertones, blue or purple veins indicate cool undertones, and if you can't tell, you likely have neutral undertones.",
          },
          {
            heading: "Creating Color Combinations",
            text: "Start with neutral bases like black, white, gray, or navy, then add pops of color through accessories or statement pieces. The 60-30-10 rule works well: 60% of your outfit should be your dominant color, 30% a secondary color, and 10% an accent color.\n\nDon't be afraid to experiment with unexpected color combinations. Sometimes the most striking outfits come from taking calculated risks with color.",
          },
          {
            heading: "Seasonal Color Adjustments",
            text: "While your undertone doesn't change, you can adapt your color choices seasonally. Spring and summer call for lighter, brighter hues, while fall and winter embrace deeper, richer tones.\n\nThis doesn't mean completely changing your wardrobe—simply adjust the intensity and warmth of your colors to align with the season while staying true to your undertone.",
          },
        ],
        conclusion:
          "Mastering color theory takes time and experimentation. Don't be discouraged if you make mistakes—they're part of the learning process. Start by identifying your undertone, build a foundation of flattering neutrals, and gradually incorporate colors that make you feel confident and beautiful. Remember, the best color to wear is always the one that makes you feel like your best self.",
      },
    },
    {
      id: 3,
      title: "Dressing for Your Body Type",
      category: "Guide",
      readTime: "8 min read",
      image:
        "https://images.unsplash.com/photo-1751399566412-ad1194241c5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHlsaXNoJTIwd29tYW4lMjBvdXRmaXR8ZW58MXx8fHwxNzYwNzA1ODA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      excerpt:
        "Understand your body shape and learn styling tricks that enhance your best features.",
      content: {
        intro:
          "Every body is unique and beautiful in its own way. Understanding your body shape and learning how to dress to highlight your favorite features is about celebrating yourself and feeling confident. This guide will help you identify your body type and discover styling techniques that work best for your figure.",
        sections: [
          {
            heading: "Identifying Your Body Shape",
            text: "The main body shapes are: pear (wider hips than shoulders), apple (wider midsection), hourglass (balanced shoulders and hips with a defined waist), rectangle (similar measurements throughout), and inverted triangle (broader shoulders than hips).\n\nTo determine your shape, take your measurements at the shoulders, bust, waist, and hips. Look at where you naturally carry weight and which areas are most proportionate. Remember, most people are a combination of shapes.",
          },
          {
            heading: "Styling for Pear Shapes",
            text: "If you have a pear shape, balance your proportions by drawing attention upward. Wear statement tops, boat necklines, and embellished jackets. Choose darker colors for bottoms and brighter colors on top.\n\nA-line skirts and wide-leg trousers are your friends. They skim over the hip area while creating a balanced silhouette. Avoid overly tight bottoms or anything that adds bulk to your lower half.",
          },
          {
            heading: "Styling for Apple Shapes",
            text: "Apple shapes look great in V-necks and wrap styles that create vertical lines and draw the eye away from the midsection. Empire waist dresses and tops that flow from the bust are flattering options.\n\nAvoid clingy fabrics around the middle. Instead, opt for structured pieces that skim the body and create definition. Show off your legs—they're typically one of your best features!",
          },
          {
            heading: "Universal Styling Tips",
            text: "Regardless of your body type, proper fit is crucial. Clothes that are too tight or too loose won't do you any favors. Get items tailored if needed—it makes a huge difference.\n\nUse accessories strategically to draw attention to your favorite features. A statement necklace highlights your face, while a belt can create the illusion of a defined waist. The most important rule is to wear what makes you feel confident.",
          },
        ],
        conclusion:
          "Understanding your body type is just one tool in your style arsenal. The goal isn't to hide anything but to highlight what you love most about yourself. Fashion should be fun and empowering, not restrictive. Use these guidelines as a starting point, but always trust your instincts and wear what makes you feel amazing. Your confidence is the best accessory you can wear.",
      },
    },
    {
      id: 4,
      title: "Sustainable Fashion: A Beginner's Guide",
      category: "Lifestyle",
      readTime: "6 min read",
      image:
        "https://images.unsplash.com/photo-1588770238925-31c80ffccb9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGZhc2hpb24lMjBlY298ZW58MXx8fHwxNzYwODU5Mjc0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      excerpt:
        "Discover how to build an eco-friendly wardrobe without sacrificing style or breaking the bank.",
      content: {
        intro:
          "The fashion industry is one of the world's largest polluters, but each of us has the power to make a difference. Sustainable fashion isn't about perfection—it's about making more conscious choices that align with your values while still expressing your personal style.",
        sections: [
          {
            heading: "Understanding Sustainable Fashion",
            text: "Sustainable fashion considers the environmental and social impact of clothing production, from raw materials to manufacturing and disposal. It encompasses ethical labor practices, eco-friendly materials, and circular fashion models that reduce waste.\n\nThe goal is to create a fashion industry that can exist indefinitely without depleting resources or harming people and the planet.",
          },
          {
            heading: "Buy Less, Choose Well",
            text: "The most sustainable garment is the one you already own. Before buying new items, shop your closet and get creative with what you have. When you do need something new, invest in quality pieces that will last for years.\n\nAsk yourself: Will I wear this at least 30 times? Does it fit well and make me feel good? Can I style it multiple ways? If the answer isn't yes to all three, reconsider the purchase.",
          },
          {
            heading: "Exploring Secondhand Options",
            text: "Thrifting, vintage shopping, and clothing swaps are fantastic ways to refresh your wardrobe sustainably. You can find unique pieces with character while giving garments a second life and keeping them out of landfills.\n\nOnline platforms for secondhand fashion have made it easier than ever to find specific items in excellent condition. You can even sell your own unwanted clothes to fund new purchases.",
          },
          {
            heading: "Caring for Your Clothes",
            text: "Extending the life of your garments is crucial for sustainability. Wash clothes less frequently, use cold water, air dry when possible, and repair items instead of discarding them. Proper care can double or triple the lifespan of your clothing.\n\nLearn basic mending skills like sewing on buttons or fixing small tears. These simple fixes can save perfectly good garments from ending up in the trash.",
          },
        ],
        conclusion:
          "Transitioning to sustainable fashion is a journey, and every small step counts. You don't have to overhaul your entire wardrobe overnight. Start with one change—maybe it's buying secondhand, supporting ethical brands, or simply taking better care of what you own. The key is to stay informed, make intentional choices, and remember that sustainable fashion is about progress, not perfection.",
      },
    },
    {
      id: 5,
      title: "Accessorizing Like a Pro",
      category: "Styling",
      readTime: "6 min read",
      image:
        "https://images.unsplash.com/photo-1569388330292-79cc1ec67270?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqZXdlbHJ5JTIwYWNjZXNzb3JpZXMlMjBmYXNoaW9ufGVufDF8fHx8MTc2MDg1OTI3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      excerpt:
        "Learn the art of accessorizing to transform simple outfits into statement looks.",
      content: {
        intro:
          "Accessories are the exclamation points of an outfit. They have the power to completely transform a look, express your personality, and take your style from basic to extraordinary. The key is knowing when to add them and when to hold back.",
        sections: [
          {
            heading: "The Power of Statement Jewelry",
            text: "A statement necklace can elevate a simple t-shirt and jeans to dinner-ready in seconds. Bold earrings add instant glamour to any outfit. The rule of thumb: if you're wearing a statement necklace, keep earrings simple, and vice versa.\n\nDon't be afraid to layer delicate necklaces for a trendy, personalized look. Mix metals and textures for added interest, but maintain balance by keeping other accessories minimal.",
          },
          {
            heading: "Bags and Shoes as Focal Points",
            text: "Your bag and shoes don't have to match, but they should complement each other and your overall outfit. A structured bag adds polish to casual looks, while a slouchy hobo bag softens formal outfits.\n\nInvest in versatile classics in neutral colors, then add personality with trendy or colorful pieces. A bright bag or statement shoes can be the anchor that pulls your entire outfit together.",
          },
          {
            heading: "Belts, Scarves, and Hats",
            text: "Belts define your waist and create shape. Use them to cinch oversized pieces or add interest to dresses and jumpsuits. Scarves are incredibly versatile—wear them around your neck, as a headband, or tied to your bag.\n\nHats instantly add sophistication and can hide a bad hair day. A classic fedora, beret, or wide-brim hat becomes your signature accessory. Just ensure the proportion works with your outfit and body type.",
          },
          {
            heading: "The Less is More Principle",
            text: "While accessories are important, over-accessorizing can overwhelm your look. Choose one statement piece as your focal point and keep everything else complementary and subtle.\n\nConsider the occasion, your outfit complexity, and your personal style. Sometimes, simple stud earrings and a classic watch are all you need. Other times, bold accessories are what make the outfit special.",
          },
        ],
        conclusion:
          "Mastering the art of accessorizing takes practice and experimentation. Pay attention to what feels right and what doesn't. Build a collection of versatile basics and a few statement pieces that reflect your personality. Remember, accessories should enhance your outfit and make you feel confident, never overwhelmed. When in doubt, put on everything you think you want to wear, then remove one piece before leaving the house.",
      },
    },
  ];

  const tips = [
    "Invest in quality basics that never go out of style",
    "Layer your outfits for dimension and versatility",
    "Accessories can transform any simple outfit",
    "Confidence is the best thing you can wear",
    "Less is more - embrace minimalism in fashion",
    "Know your measurements for perfect fit every time",
  ];

  const quotes = [
    {
      text: "Style is a way to say who you are without having to speak.",
      author: "Rachel Zoe",
    },
    {
      text: "Fashion is about dressing according to what's fashionable. Style is more about being yourself.",
      author: "Oscar de la Renta",
    },
    {
      text: "Elegance is elimination.",
      author: "Cristóbal Balenciaga",
    },
  ];

  // If an article is selected, show the reader
  if (selectedArticle) {
    return (
      <ArticleReader
        article={selectedArticle}
        onBack={() => setSelectedArticle(null)}
      />
    );
  }

  return (
    <div className="pb-24 min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-3">
          <button onClick={() => onNavigate("dashboard")}>
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <div>
            <h1 className="text-slate-900">Fashion Tips</h1>
            <p className="text-slate-600 text-sm">
              Articles, guides, and inspiration
            </p>
          </div>
        </div>
      </div>

      {/* Hero Quote */}
      <div className="bg-gradient-to-br from-slate-900 via-rose-900 to-amber-900 text-white px-6 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Sparkles className="w-10 h-10 mx-auto mb-4 text-amber-300" />
          <blockquote className="text-xl mb-3 italic">
            "{quotes[0].text}"
          </blockquote>
          <p className="text-amber-100/80">— {quotes[0].author}</p>
        </div>
      </div>

      {/* Featured Articles */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-5 h-5 text-slate-700" />
          <h2 className="text-slate-900">Featured Articles</h2>
        </div>

        <div className="space-y-4 mb-12">
          {articles.map((article) => (
            <Card
              key={article.id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedArticle(article)}
            >
              <div className="flex gap-4">
                <ImageWithFallback
                  src={article.image}
                  alt={article.title}
                  className="w-32 h-32 object-cover shrink-0"
                />
                <div className="flex-1 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {article.category}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {article.readTime}
                    </span>
                  </div>
                  <h3 className="mb-2 text-slate-900">{article.title}</h3>
                  <p className="text-slate-600 text-sm line-clamp-2">
                    {article.excerpt}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Tips */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-rose-800" />
            <h2 className="text-slate-900">Quick Styling Tips</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {tips.map((tip, index) => (
              <Card
                key={index}
                className="p-4 bg-gradient-to-br from-stone-50 to-amber-50 border border-amber-100"
              >
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-amber-800 text-white rounded-full flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-slate-700 pt-1">{tip}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Inspirational Quotes */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Heart className="w-5 h-5 text-amber-700" />
            <h2 className="text-slate-900">Style Inspiration</h2>
          </div>

          <div className="space-y-4">
            {quotes.slice(1).map((quote, index) => (
              <Card
                key={index}
                className="p-6 bg-white border border-slate-100"
              >
                <blockquote className="text-lg text-slate-700 mb-2 italic">
                  "{quote.text}"
                </blockquote>
                <p className="text-slate-600 text-sm">— {quote.author}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
