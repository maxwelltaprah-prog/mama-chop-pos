import { useState, useRef } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, X, Upload, Loader2 } from 'lucide-react';
import { formatCurrency, categories } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  useMenuItems, 
  useCreateMenuItem, 
  useUpdateMenuItem, 
  useDeleteMenuItem,
  useUploadMenuImage,
  MenuItemRow,
  MenuItemSize,
  MenuItemAddon,
} from '@/hooks/useMenuItems';

export function MenuManagement() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemRow | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItemRow | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading } = useMenuItems();
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const uploadImage = useUploadMenuImage();

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAvailability = (item: MenuItemRow) => {
    updateMenuItem.mutate({
      id: item.id,
      available: !item.available,
    });
  };

  const getCategoryIcon = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.icon || '🍽️';
  };

  const openAddDialog = () => {
    setEditingItem(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormCategory('main');
    setFormImageUrl('');
    setImageFile(null);
    setImagePreview(null);
    setDialogOpen(true);
  };

  const openEditDialog = (item: MenuItemRow) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDescription(item.description || '');
    setFormPrice(String(item.price));
    setFormCategory(item.category);
    setFormImageUrl(item.image_url || '');
    setImageFile(null);
    setImagePreview(item.image_url || null);
    setDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formName || !formPrice || !formCategory) {
      return;
    }

    let imageUrl = formImageUrl;

    // Upload image if selected
    if (imageFile) {
      try {
        imageUrl = await uploadImage.mutateAsync(imageFile);
      } catch {
        return;
      }
    }

    const itemData = {
      name: formName,
      description: formDescription || null,
      price: parseFloat(formPrice),
      category: formCategory,
      image_url: imageUrl || null,
    };

    if (editingItem) {
      updateMenuItem.mutate(
        { id: editingItem.id, ...itemData },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createMenuItem.mutate(
        itemData,
        { onSuccess: () => setDialogOpen(false) }
      );
    }
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMenuItem.mutate(itemToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setItemToDelete(null);
        },
      });
    }
  };

  const isSubmitting = createMenuItem.isPending || updateMenuItem.isPending || uploadImage.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold">Menu Management</h1>
          <p className="text-muted-foreground">Add, edit, and manage your menu items</p>
        </div>
        <Button variant="gradient" size="lg" onClick={openAddDialog}>
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
              <div className="aspect-video bg-muted flex items-center justify-center text-6xl relative overflow-hidden">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getCategoryIcon(item.category)
                )}
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
                    {formatCurrency(Number(item.price))}
                  </p>
                </div>

                {/* Sizes */}
                {item.sizes && Array.isArray(item.sizes) && item.sizes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(item.sizes as unknown as MenuItemSize[]).map((size) => (
                      <Badge key={size.name} variant="secondary" className="text-xs">
                        {size.name}: {formatCurrency(size.price)}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Add-ons */}
                {item.addons && Array.isArray(item.addons) && item.addons.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(item.addons as unknown as MenuItemAddon[]).map((addon) => (
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
                    onClick={() => toggleAvailability(item)}
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
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => openEditDialog(item)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => {
                        setItemToDelete(item);
                        setDeleteDialogOpen(true);
                      }}
                    >
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update the menu item details' : 'Fill in the details for the new menu item'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Item Image</Label>
              <div 
                className="relative aspect-video bg-muted rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageFile(null);
                        setImagePreview(null);
                        setFormImageUrl('');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Upload className="w-8 h-8 mb-2" />
                    <p className="text-sm font-medium">Click to upload image</p>
                    <p className="text-xs">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Jollof Rice with Chicken"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe the dish..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price (GH₵) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="mr-2">{cat.icon}</span>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="gradient" 
              onClick={handleSubmit}
              disabled={isSubmitting || !formName || !formPrice || !formCategory}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploadImage.isPending ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                editingItem ? 'Update Item' : 'Add Item'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMenuItem.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
