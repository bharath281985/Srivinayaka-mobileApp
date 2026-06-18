// Production API by default. Override with EXPO_PUBLIC_API_BASE_URL in .env if needed.
require('dotenv').config({ path: require('path').join(__dirname, '.env'), quiet: true });
const appJson = require('./app.json');
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || appJson.expo.extra?.apiBaseUrl || 'https://backendapis.srivinayakacollections.com';

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      apiBaseUrl,
      imageBaseUrl: process.env.EXPO_PUBLIC_IMAGE_BASE_URL || appJson.expo.extra?.imageBaseUrl || 'https://backendapis.srivinayakacollections.com',
    },
  },
};
