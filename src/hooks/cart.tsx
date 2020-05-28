import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const loadItems = await AsyncStorage.getItem('@GoMarketplace:cart-items');

      if (!loadItems) {
        return;
      }

      const convertedProducts = JSON.parse(loadItems) as Product[];

      setProducts(convertedProducts);
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const productsList = [...products];

      const productAlreadyInCart = productsList.some(
        cartProduct => cartProduct.id === product.id,
      );

      if (productAlreadyInCart) {
        const cartItemIndex = productsList.findIndex(
          cartProduct => cartProduct.id === product.id,
        );

        productsList[cartItemIndex].quantity += 1;
      } else {
        productsList.push({ ...product, quantity: 1 });
      }

      setProducts(productsList);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart-items',
        JSON.stringify(productsList),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productsList = [...products];

      const productIndex = productsList.findIndex(product => product.id === id);

      productsList[productIndex].quantity += 1;

      setProducts(productsList);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart-items',
        JSON.stringify(productsList),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productsList = [...products];

      const productIndex = productsList.findIndex(product => product.id === id);

      productsList[productIndex].quantity -= 1;

      if (productsList[productIndex].quantity <= 0) {
        productsList.splice(productIndex, 1);
      }

      setProducts(productsList);

      await AsyncStorage.setItem(
        '@GoMarketplace:cart-items',
        JSON.stringify(productsList),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
