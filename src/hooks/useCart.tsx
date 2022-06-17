import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import {
  Product,
  // Stock 
} from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let newCart = [...cart];

      const { data: stock } = await api.get(`/stock/${productId}`);

      const productExist = newCart.find(cartProduct => cartProduct.id === productId);
      const stockAmount = stock.amount;
      const currentAmount = productExist ? productExist.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExist) {
        productExist.amount = amount;
      } else {
        const { data: product } = await api.get(`/products/${productId}`);

        newCart = [
          ...cart,
          {
            ...product,
            amount
          }
        ];
      }



      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(cartProduct => cartProduct.id === productId);
      if (productIndex < 0) {
        toast.error('Erro na remoção do produto');
        return;
      }

      const productRemoved = cart.filter((product) => product.id !== productId);

      setCart(productRemoved);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(productRemoved));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      let newCart = [...cart];
      const productIndex = cart.findIndex(cartProduct => cartProduct.id === productId);

      newCart[productIndex] = { ...newCart[productIndex], amount };

      const { data: stock } = await api.get(`/stock/${productId}`);

      if (newCart[productIndex].amount > stock.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
