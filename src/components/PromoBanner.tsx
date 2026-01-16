import { Phone, MapPin, Clock, Sparkles } from 'lucide-react';

const promoItems = [
  { emoji: '🍛', name: 'Jollof Rice', offer: '15% OFF' },
  { emoji: '🍖', name: 'Grilled Tilapia', offer: 'Best Seller' },
  { emoji: '🥘', name: 'Fufu & Soup', offer: 'Family Pack' },
  { emoji: '🍗', name: 'Banku & Okro', offer: 'New!' },
];

export function PromoBanner() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary via-accent to-primary rounded-2xl mx-4 mb-6 shadow-lg">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.4%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
      </div>
      
      {/* Sparkle decorations */}
      <Sparkles className="absolute top-3 right-4 w-5 h-5 text-primary-foreground/60 animate-pulse" />
      <Sparkles className="absolute bottom-4 left-6 w-4 h-4 text-primary-foreground/40 animate-pulse delay-300" />
      
      <div className="relative z-10 p-5">
        {/* Main headline */}
        <div className="text-center mb-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary-foreground mb-1 animate-pulse-soft">
            🎉 Special Offers Today!
          </h2>
          <p className="text-primary-foreground/80 text-sm">
            Authentic Ghanaian Cuisine • Fresh & Delicious
          </p>
        </div>

        {/* Scrolling food items */}
        <div className="relative overflow-hidden py-3">
          <div className="flex gap-4 animate-scroll-x">
            {[...promoItems, ...promoItems].map((item, idx) => (
              <div 
                key={idx}
                className="flex-shrink-0 bg-background/20 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3 border border-primary-foreground/20 hover:bg-background/30 transition-colors"
              >
                <span className="text-3xl">{item.emoji}</span>
                <div>
                  <p className="font-semibold text-primary-foreground text-sm">{item.name}</p>
                  <span className="text-xs font-bold text-accent-foreground bg-accent/80 px-2 py-0.5 rounded-full">
                    {item.offer}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact info bar */}
        <div className="mt-4 pt-4 border-t border-primary-foreground/20">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-primary-foreground text-xs md:text-sm">
            <a href="tel:+233200000000" className="flex items-center gap-1.5 hover:text-accent-foreground transition-colors">
              <Phone className="w-4 h-4" />
              <span className="font-medium">+233 20 000 0000</span>
            </a>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>8AM - 10PM Daily</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>Accra, Ghana</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
