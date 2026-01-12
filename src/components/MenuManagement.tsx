import { useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { menuItems, categories, formatCurrency, type MenuItem } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function MenuManagement() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState(menuItems);

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAvailability = (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, available: !item.available } : item
    ));
  };

  const getCategoryIcon = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.icon || '🍽️';
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Menu Management</h1>
          <p className="text-muted-foreground">Add, edit, and manage your menu items</p>
        </div>
        <Button variant="gradient" size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Add New Item
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
          >
            All Items
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(cat.id)}
              className="shrink-0"
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{items.length}</p>
            <p className="text-sm text-muted-foreground">Total Items</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{items.filter(i => i.available).length}</p>
            <p className="text-sm text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{items.filter(i => !i.available).length}</p>
            <p className="text-sm text-muted-foreground">Out of Stock</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{categories.length}</p>
            <p className="text-sm text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item, index) => (
          <Card 
            key={item.id}
            className={cn(
              'animate-fade-in overflow-hidden transition-all duration-300',
              !item.available && 'opacity-60'
            )}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <CardContent className="p-0">
              <div className="aspect-video bg-muted flex items-center justify-center text-6xl relative">
                {getCategoryIcon(item.category)}
                {!item.available && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Badge variant="destructive" className="text-lg px-4 py-2">
                      Out of Stock
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  </div>
                  <p className="font-bold text-primary shrink-0 ml-2">
                    {formatCurrency(item.price)}
                  </p>
                </div>

                {/* Sizes */}
                {item.sizes && item.sizes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.sizes.map((size) => (
                      <Badge key={size.name} variant="secondary" className="text-xs">
                        {size.name}: {formatCurrency(size.price)}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Add-ons */}
                {item.addons && item.addons.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.addons.map((addon) => (
                      <Badge key={addon.name} variant="outline" className="text-xs">
                        +{addon.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAvailability(item.id)}
                    className={item.available ? 'text-success' : 'text-muted-foreground'}
                  >
                    {item.available ? (
                      <>
                        <ToggleRight className="w-4 h-4 mr-1" />
                        Available
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 mr-1" />
                        Unavailable
                      </>
                    )}
                  </Button>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-6xl mb-4">🍽️</span>
          <p className="font-medium text-muted-foreground">No items found</p>
          <p className="text-sm text-muted-foreground/70">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
