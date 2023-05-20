export const SubscribeTypes = {
  Subscribe: [
    { name: 'address', type: 'address' },
    { name: 'email', type: 'string' }
  ]
};

export const SubscriptionsTypes = {
  Subscriptions: [
    { name: 'address', type: 'address' },
    { name: 'email', type: 'string' },
    { name: 'subscriptions', type: 'string[]' }
  ]
};

export const UnsubscribeTypes = {
  Unsubscribe: [
    { name: 'address', type: 'address' },
    { name: 'email', type: 'string' }
  ]
};
