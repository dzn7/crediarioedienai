import { User } from '@/types/crediario';

// Local users (matching the original system)
const localUsers: User[] = [
  { pin: '3007', displayName: 'Proprietário', role: 'owner' },
  { pin: '5678', displayName: 'Garçom', role: 'waiter' }
];

export function authenticateUser(pin: string): User | null {
  return localUsers.find(user => user.pin === pin) || null;
}

export function saveLoginState(user: User): void {
  localStorage.setItem('loggedInUserPin', user.pin);
  localStorage.setItem('loggedInUserName', user.displayName);
  localStorage.setItem('loggedInUserRole', user.role);
}

export function loadLoginState(): User | null {
  const pin = localStorage.getItem('loggedInUserPin');
  const name = localStorage.getItem('loggedInUserName'); 
  const role = localStorage.getItem('loggedInUserRole');
  
  if (pin && name && role) {
    const user = localUsers.find(u => u.pin === pin && u.displayName === name && u.role === role as 'owner' | 'waiter');
    return user || null;
  }
  return null;
}

export function clearLoginState(): void {
  localStorage.removeItem('loggedInUserPin');
  localStorage.removeItem('loggedInUserName');
  localStorage.removeItem('loggedInUserRole');
}
