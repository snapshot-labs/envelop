export interface Subscriber {
  address: string;
  email: string;
}

export const SubscriberTypes = {
  Subscriber: [
    { name: 'address', type: 'address' },
    { name: 'email', type: 'string' }
  ]
};
