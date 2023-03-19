export interface Subscription {
  address: string;
  email: string;
  action: string;
}

export const SubscriptionTypes = {
  Subscriber: [
    { name: 'address', type: 'address' },
    { name: 'email', type: 'string' },
    { name: 'action', type: 'string' }
  ]
};
