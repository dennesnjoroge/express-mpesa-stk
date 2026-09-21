import { customAlphabet } from "nanoid";

const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";

export const generateSubscriptionId = () => {
  const subscriptionId = customAlphabet(alphabet, 12);

  return subscriptionId();
};
