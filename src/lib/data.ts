// Sample data for ChopBar POS

export type OrderType = 'dine-in' | 'takeaway' | 'delivery';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed';
export type PaymentMethod = 'cash' | 'mtn-momo' | 'vodafone-cash' | 'airteltigo';
export type PaymentStatus = 'pending' | 'paid' | 'pay-on-delivery';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  sizes?: { name: string; price: number }[];
  addons?: { name: string; price: number }[];
}

export interface Order {
  id: string;
  items: { item: MenuItem; quantity: number; size?: string; addons?: string[]; notes?: string }[];
  type: OrderType;
  status: OrderStatus;
  tableNumber?: number;
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: Date;
}

export interface Table {
  id: number;
  name: string;
  seats: number;
  status: 'available' | 'occupied' | 'reserved';
  currentOrderId?: string;
}

export const categories = [
  { id: 'main', name: 'Main Meals', icon: '🍛', color: 'bg-primary' },
  { id: 'soups', name: 'Soups & Stews', icon: '🍲', color: 'bg-accent' },
  { id: 'grills', name: 'Grills & BBQ', icon: '🍗', color: 'bg-destructive' },
  { id: 'drinks', name: 'Drinks', icon: '🥤', color: 'bg-success' },
  { id: 'snacks', name: 'Snacks', icon: '🥟', color: 'bg-warning' },
  { id: 'desserts', name: 'Desserts', icon: '🍨', color: 'bg-secondary' },
];

export const menuItems: MenuItem[] = [
  // Main Meals
  {
    id: '1',
    name: 'Jollof Rice with Chicken',
    description: 'Smoky Ghana jollof with perfectly grilled chicken',
    price: 45,
    category: 'main',
    image: '/placeholder.svg',
    available: true,
    sizes: [
      { name: 'Regular', price: 45 },
      { name: 'Large', price: 60 },
    ],
    addons: [
      { name: 'Extra Chicken', price: 15 },
      { name: 'Shito', price: 5 },
      { name: 'Salad', price: 8 },
    ],
  },
  {
    id: '2',
    name: 'Waakye Special',
    description: 'Rice & beans with spaghetti, gari, egg & wele',
    price: 35,
    category: 'main',
    image: '/placeholder.svg',
    available: true,
    sizes: [
      { name: 'Regular', price: 35 },
      { name: 'Large', price: 50 },
    ],
  },
  {
    id: '3',
    name: 'Banku with Tilapia',
    description: 'Fermented corn dough with grilled tilapia & pepper',
    price: 55,
    category: 'main',
    image: '/placeholder.svg',
    available: true,
  },
  {
    id: '4',
    name: 'Fufu with Light Soup',
    description: 'Pounded cassava & plantain with goat meat soup',
    price: 50,
    category: 'main',
    image: '/placeholder.svg',
    available: true,
  },
  {
    id: '5',
    name: 'Fried Rice with Beef',
    description: 'Special fried rice with tender beef strips',
    price: 48,
    category: 'main',
    image: '/placeholder.svg',
    available: true,
  },
  // Soups
  {
    id: '6',
    name: 'Groundnut Soup',
    description: 'Rich peanut soup with your choice of protein',
    price: 40,
    category: 'soups',
    image: '/placeholder.svg',
    available: true,
  },
  {
    id: '7',
    name: 'Palm Nut Soup',
    description: 'Creamy palm fruit soup with smoked fish',
    price: 42,
    category: 'soups',
    image: '/placeholder.svg',
    available: true,
  },
  // Grills
  {
    id: '8',
    name: 'Grilled Tilapia',
    description: 'Whole tilapia grilled with special spices',
    price: 65,
    category: 'grills',
    image: '/placeholder.svg',
    available: true,
  },
  {
    id: '9',
    name: 'Suya Beef Skewers',
    description: 'Spicy grilled beef with yaji spice',
    price: 30,
    category: 'grills',
    image: '/placeholder.svg',
    available: true,
  },
  {
    id: '10',
    name: 'Chicken Wings (6pcs)',
    description: 'Crispy fried wings with hot sauce',
    price: 35,
    category: 'grills',
    image: '/placeholder.svg',
    available: false,
  },
  // Drinks
  {
    id: '11',
    name: 'Sobolo',
    description: 'Refreshing hibiscus drink',
    price: 8,
    category: 'drinks',
    image: '/placeholder.svg',
    available: true,
    sizes: [
      { name: 'Regular', price: 8 },
      { name: 'Large', price: 12 },
    ],
  },
  {
    id: '12',
    name: 'Fresh Coconut',
    description: 'Chilled coconut water straight from the shell',
    price: 10,
    category: 'drinks',
    image: '/placeholder.svg',
    available: true,
  },
  {
    id: '13',
    name: 'Malt',
    description: 'Chilled malt drink',
    price: 12,
    category: 'drinks',
    image: '/placeholder.svg',
    available: true,
  },
  {
    id: '14',
    name: 'Bottled Water',
    description: '500ml purified water',
    price: 3,
    category: 'drinks',
    image: '/placeholder.svg',
    available: true,
  },
  // Snacks
  {
    id: '15',
    name: 'Meat Pie',
    description: 'Flaky pastry filled with spiced minced meat',
    price: 8,
    category: 'snacks',
    image: '/placeholder.svg',
    available: true,
  },
  {
    id: '16',
    name: 'Spring Rolls (4pcs)',
    description: 'Crispy veggie rolls with sweet chili sauce',
    price: 15,
    category: 'snacks',
    image: '/placeholder.svg',
    available: true,
  },
  {
    id: '17',
    name: 'Kelewele',
    description: 'Spicy fried plantain cubes',
    price: 12,
    category: 'snacks',
    image: '/placeholder.svg',
    available: true,
  },
  // Desserts
  {
    id: '18',
    name: 'Ice Cream (2 scoops)',
    description: 'Vanilla, chocolate, or strawberry',
    price: 15,
    category: 'desserts',
    image: '/placeholder.svg',
    available: true,
  },
];

export const tables: Table[] = [
  { id: 1, name: 'Table 1', seats: 4, status: 'occupied' },
  { id: 2, name: 'Table 2', seats: 4, status: 'available' },
  { id: 3, name: 'Table 3', seats: 6, status: 'available' },
  { id: 4, name: 'Table 4', seats: 2, status: 'occupied' },
  { id: 5, name: 'Table 5', seats: 8, status: 'reserved' },
  { id: 6, name: 'Table 6', seats: 4, status: 'available' },
  { id: 7, name: 'Table 7', seats: 4, status: 'available' },
  { id: 8, name: 'Table 8', seats: 6, status: 'occupied' },
];

export const sampleOrders: Order[] = [
  {
    id: 'ORD-001',
    items: [
      { item: menuItems[0], quantity: 2, size: 'Large' },
      { item: menuItems[10], quantity: 2 },
    ],
    type: 'dine-in',
    status: 'preparing',
    tableNumber: 1,
    paymentMethod: 'mtn-momo',
    paymentStatus: 'paid',
    total: 136,
    createdAt: new Date(Date.now() - 15 * 60000),
  },
  {
    id: 'ORD-002',
    items: [
      { item: menuItems[1], quantity: 1 },
      { item: menuItems[8], quantity: 2 },
      { item: menuItems[13], quantity: 1 },
    ],
    type: 'takeaway',
    status: 'ready',
    customerName: 'Kwame Asante',
    customerPhone: '0244123456',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    total: 98,
    createdAt: new Date(Date.now() - 8 * 60000),
  },
  {
    id: 'ORD-003',
    items: [
      { item: menuItems[2], quantity: 1 },
      { item: menuItems[11], quantity: 1 },
    ],
    type: 'dine-in',
    status: 'served',
    tableNumber: 4,
    paymentMethod: 'vodafone-cash',
    paymentStatus: 'paid',
    total: 65,
    createdAt: new Date(Date.now() - 45 * 60000),
  },
  {
    id: 'ORD-004',
    items: [
      { item: menuItems[7], quantity: 1 },
      { item: menuItems[16], quantity: 1 },
      { item: menuItems[10], quantity: 2, size: 'Large' },
    ],
    type: 'dine-in',
    status: 'pending',
    tableNumber: 8,
    paymentStatus: 'pending',
    total: 101,
    createdAt: new Date(Date.now() - 2 * 60000),
  },
];

export const todayStats = {
  totalSales: 2450,
  totalOrders: 47,
  dineInOrders: 28,
  takeawayOrders: 15,
  deliveryOrders: 4,
  cashPayments: 980,
  momoPayments: 1470,
  averageOrderValue: 52.13,
  topSellingItems: [
    { name: 'Jollof Rice with Chicken', count: 23 },
    { name: 'Waakye Special', count: 18 },
    { name: 'Grilled Tilapia', count: 12 },
    { name: 'Sobolo', count: 31 },
    { name: 'Kelewele', count: 15 },
  ],
};

export const formatCurrency = (amount: number): string => {
  return `GH₵ ${amount.toFixed(2)}`;
};

export const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case 'pending':
      return 'bg-warning/20 text-warning';
    case 'preparing':
      return 'bg-accent/20 text-accent';
    case 'ready':
      return 'bg-success/20 text-success';
    case 'served':
      return 'bg-primary/20 text-primary';
    case 'completed':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const getPaymentIcon = (method: PaymentMethod): string => {
  switch (method) {
    case 'mtn-momo':
      return '📱';
    case 'vodafone-cash':
      return '📲';
    case 'airteltigo':
      return '💳';
    case 'cash':
      return '💵';
    default:
      return '💰';
  }
};
