import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatQuantity(kg: number): string {
  if (kg >= 1000) {
    const tons = (kg / 1000).toFixed(1).replace(/\.0$/, '');
    return `${kg.toLocaleString('en-IN')} kg (${tons} MT)`;
  }
  return `${kg.toLocaleString('en-IN')} kg`;
}

export function formatDate(dateInput: string | Date | undefined): string {
  if (!dateInput) return 'N/A';
  const date = new Date(dateInput);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}
