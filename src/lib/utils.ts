import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBR(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

export function parseNumber(value: string): number {
  return parseFloat(value.replace(',', '.')) || 0;
}
