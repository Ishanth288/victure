// Mock WhatsApp Service

// Simulate a database of messages
const messageHistory = [
  {
    id: 1,
    to: '+15551234567',
    body: 'Your prescription is ready for pickup.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'delivered',
  },
  {
    id: 2,
    to: '+15559876543',
    body: 'Reminder: Your appointment is tomorrow at 10:00 AM.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'sent',
  },
];

// Simulate API latency
const simulateDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const connectWhatsApp = async () => {
  await simulateDelay(1000);
  // Simulate a 10% chance of failure
  if (Math.random() < 0.1) {
    throw new Error('Failed to connect to WhatsApp. Please try again.');
  }
  return { success: true, message: 'WhatsApp connected successfully.' };
};

export const disconnectWhatsApp = async () => {
  await simulateDelay(500);
  return { success: true, message: 'WhatsApp disconnected.' };
};

export const sendMessage = async (to, body) => {
  await simulateDelay(1500);
  if (!to || !body) {
    throw new Error('Phone number and message body are required.');
  }
  // Simulate a 15% chance of failure
  if (Math.random() < 0.15) {
    throw new Error('Failed to send message. The recipient number may be invalid.');
  }
  const newMessage = {
    id: messageHistory.length + 1,
    to,
    body,
    timestamp: new Date().toISOString(),
    status: 'sent',
  };
  messageHistory.push(newMessage);
  return { success: true, message: 'Message sent successfully.', data: newMessage };
};

export const getMessageHistory = async () => {
  await simulateDelay(800);
  return { success: true, data: [...messageHistory].reverse() };
};