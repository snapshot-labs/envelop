export interface Subscriber {
  address: string;
  email: string;
}

export const SubscribeTypes = {
  Subscribe: [
    { name: 'address', type: 'address' },
    { name: 'email', type: 'string' }
  ]
};

export const UnsubscribeTypes = {
  Subscribe: [
    { name: 'address', type: 'address' },
    { name: 'email', type: 'string' }
  ]
};