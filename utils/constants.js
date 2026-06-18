export const ROUTES = {
  HOME: 'Home',
  PRODUCT_DETAILS: 'ProductDetails',
  PRODUCT_LISTING: 'ProductListing',
  CATEGORY_LISTING: 'CategoryListing',
  SUBCATEGORY_LISTING: 'SubcategoryListing',
  CART: 'Cart',
  CHECKOUT: 'Checkout',
  ORDER_SUCCESS: 'OrderSuccess',
  MY_ORDERS: 'MyOrders',
  ORDER_DETAILS: 'OrderDetails',
  ORDER_TRACKING: 'OrderTracking',
  PROFILE: 'Profile',
  SEARCH: 'Search',
  WISHLIST: 'Wishlist',
  NOTIFICATIONS: 'Notifications',
};

export const ORDER_STATUSES = ['Order Confirmed', 'Order Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
export const CANCELLED_STATUSES = ['Canceled', 'Returned'];

export const normalizeOrderStatus = (status) => {
  const map = {
    Pending: 'Order Confirmed',
    Processing: 'Order Packed',
    'In-Production': 'Order Packed',
    'Out for Delhivary': 'Out for Delivery',
    Delhivered: 'Delivered',
  };

  return map[status] || status || 'Order Confirmed';
};
