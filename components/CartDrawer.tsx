
import React, { useState } from 'react';
import { XMarkIcon, ShoppingCartIcon, TrashIcon, PlusIcon, MinusIcon } from './Icons';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    type: 'Physical' | 'Digital';
}

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const initialItems: CartItem[] = [
    { id: '1', name: 'Quantum Processor Unit', price: 4999.99, quantity: 1, image: 'https://images.unsplash.com/photo-1555664424-778a69022365?q=80&w=200', type: 'Physical' },
    { id: '2', name: 'Neural Interface Headset', price: 299.00, quantity: 2, image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200', type: 'Physical' },
    { id: '3', name: 'Neon Theme Pack', price: 5.00, quantity: 1, image: 'https://ui-avatars.com/api/?name=NT&background=000&color=fff', type: 'Digital' },
];

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
    const [items, setItems] = useState<CartItem[]>(initialItems);
    
    const updateQty = (id: string, delta: number) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeItem = (id: string) => {
        if (window.confirm("Are you sure you want to remove this item?")) {
             setItems(prev => prev.filter(i => i.id !== id));
        }
    };

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black/50 z-[60] animate-fade-in" onClick={onClose} />}
            <div className={`fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ShoppingCartIcon className="w-6 h-6 text-blue-600" /> 
                        Your Cart ({itemCount})
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <ShoppingCartIcon className="w-12 h-12 mb-2 opacity-20" />
                            <p>Your cart is empty.</p>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="flex gap-3 bg-white dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md bg-gray-100" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate pr-2" title={item.name}>{item.name}</h4>
                                        <span className="text-[10px] bg-gray-200 dark:bg-gray-600 px-1.5 rounded text-gray-600 dark:text-gray-300">{item.type}</span>
                                    </div>
                                    <p className="text-blue-600 dark:text-blue-400 font-bold text-sm mt-0.5">${item.price.toFixed(2)}</p>
                                    
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600 px-1">
                                            <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:text-blue-500 transition-colors"><MinusIcon className="w-3 h-3" /></button>
                                            <span className="text-xs font-mono w-4 text-center select-none">{item.quantity}</span>
                                            <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:text-blue-500 transition-colors"><PlusIcon className="w-3 h-3" /></button>
                                        </div>
                                        <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="Remove Item">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between text-gray-500">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                            <span>Tax (Est. 8%)</span>
                            <span>${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg text-gray-800 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>
                    <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-colors flex items-center justify-center gap-2">
                        <ShoppingCartIcon className="w-5 h-5" /> Checkout
                    </button>
                </div>
            </div>
        </>
    );
};
