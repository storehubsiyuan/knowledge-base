const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// Import all vulnerable controllers
const paymentController = require('./controllers/paymentController');
const authController = require('./controllers/authController');
const xssController = require('./controllers/xssController');
const sessionController = require('./controllers/sessionController');
const cartController = require('./controllers/cartController');
const mongoController = require('./controllers/mongoController');
const businessLogicController = require('./controllers/businessLogicController');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Payment Security Vulnerabilities
app.post('/api/payment/process', paymentController.processPayment.bind(paymentController));
app.post('/api/payment/stripe', paymentController.processStripePayment.bind(paymentController));
app.post('/api/payment/refund', paymentController.processRefund.bind(paymentController));
app.post('/api/payment/split', paymentController.splitPayment.bind(paymentController));
app.post('/api/payment/convert', paymentController.convertCurrency.bind(paymentController));
app.post('/api/payment/discount', paymentController.applyDiscount.bind(paymentController));
app.post('/api/payment/method', paymentController.addPaymentMethod.bind(paymentController));
app.post('/api/payment/fees', paymentController.calculateFees.bind(paymentController));

// Authentication Vulnerabilities
app.post('/api/auth/login', authController.login.bind(authController));
app.post('/api/auth/verify', authController.verifyToken.bind(authController));
app.post('/api/auth/session', authController.createSession.bind(authController));
app.post('/api/auth/register', authController.register.bind(authController));
app.post('/api/auth/authenticate', authController.authenticate.bind(authController));
app.post('/api/auth/reset', authController.requestPasswordReset.bind(authController));
app.post('/api/auth/brute', authController.bruteForceableLogin.bind(authController));
app.get('/api/auth/oauth/callback', authController.oauthCallback.bind(authController));
app.post('/api/auth/role', authController.updateUserRole.bind(authController));

// XSS Vulnerabilities
app.post('/api/xss/profile', xssController.renderUserProfile.bind(xssController));
app.post('/api/xss/react', xssController.getReactComponent.bind(xssController));
app.post('/api/xss/template', xssController.renderTemplate.bind(xssController));
app.post('/api/xss/button', xssController.generateButton.bind(xssController));
app.get('/api/xss/search', xssController.searchResults.bind(xssController));
app.post('/api/xss/avatar', xssController.uploadAvatar.bind(xssController));
app.post('/api/xss/theme', xssController.customTheme.bind(xssController));
app.get('/api/xss/reflect', xssController.reflectParam.bind(xssController));
app.get('/api/xss/client', xssController.clientSideTemplate.bind(xssController));
app.post('/api/xss/comment', xssController.saveComment.bind(xssController));
app.post('/api/xss/multi', xssController.multiContextXSS.bind(xssController));

// Session Security Vulnerabilities
app.post('/api/session/create', sessionController.createSession.bind(sessionController));
app.get('/api/session/cors', sessionController.corsConfig.bind(sessionController));
app.get('/api/session/data/:sessionId', sessionController.getSessionData.bind(sessionController));
app.post('/api/session/generate', sessionController.generatePredictableSession.bind(sessionController));
app.post('/api/session/login', sessionController.loginWithSession.bind(sessionController));
app.post('/api/session/share', sessionController.shareSession.bind(sessionController));
app.post('/api/session/extend', sessionController.extendSession.bind(sessionController));
app.get('/api/session/storage', sessionController.getClientStorage.bind(sessionController));
app.post('/api/session/subdomain', sessionController.configureSubdomainSession.bind(sessionController));
app.get('/api/session/track', sessionController.trackSession.bind(sessionController));
app.post('/api/session/transmit', sessionController.transmitSession.bind(sessionController));

// Cart/Price Manipulation Vulnerabilities
app.post('/api/cart/add', cartController.addToCart.bind(cartController));
app.post('/api/cart/total', cartController.updateCartTotal.bind(cartController));
app.post('/api/cart/quantity', cartController.updateQuantity.bind(cartController));
app.post('/api/cart/discounts', cartController.applyDiscounts.bind(cartController));
app.post('/api/cart/shipping', cartController.calculateShipping.bind(cartController));
app.post('/api/cart/tax', cartController.calculateTax.bind(cartController));
app.post('/api/cart/bundle', cartController.createBundle.bind(cartController));
app.post('/api/cart/coupon', cartController.validateCoupon.bind(cartController));
app.post('/api/cart/merge', cartController.mergeCarts.bind(cartController));
app.post('/api/cart/checkout', cartController.validateCheckout.bind(cartController));

// MongoDB Security Vulnerabilities
app.post('/api/mongo/login', mongoController.findWithNegation.bind(mongoController));
app.post('/api/mongo/where', mongoController.searchWithWhere.bind(mongoController));
app.post('/api/mongo/regex', mongoController.searchByPattern.bind(mongoController));
app.post('/api/mongo/exists', mongoController.checkFieldExists.bind(mongoController));
app.post('/api/mongo/search', mongoController.advancedSearch.bind(mongoController));
app.post('/api/mongo/update', mongoController.updateProfile.bind(mongoController));
app.post('/api/mongo/aggregate', mongoController.getStatistics.bind(mongoController));
app.post('/api/mongo/lookup', mongoController.joinCollections.bind(mongoController));
app.post('/api/mongo/text', mongoController.textSearch.bind(mongoController));
app.post('/api/mongo/mapreduce', mongoController.mapReduce.bind(mongoController));
app.post('/api/mongo/findupdate', mongoController.updateSingleRecord.bind(mongoController));
app.post('/api/mongo/distinct', mongoController.getDistinctValues.bind(mongoController));
app.post('/api/mongo/count', mongoController.countDocuments.bind(mongoController));
app.post('/api/mongo/bulk', mongoController.bulkOperations.bind(mongoController));

// Business Logic Vulnerabilities
app.post('/api/logic/payment-inventory', businessLogicController.processPaymentWithInventory.bind(businessLogicController));
app.post('/api/logic/tenant', businessLogicController.accessTenantData.bind(businessLogicController));
app.post('/api/logic/reserve', businessLogicController.reserveInventory.bind(businessLogicController));
app.post('/api/logic/webhook', businessLogicController.handlePaymentWebhook.bind(businessLogicController));
app.post('/api/logic/price', businessLogicController.calculateFinalPrice.bind(businessLogicController));
app.post('/api/logic/book', businessLogicController.bookResource.bind(businessLogicController));
app.post('/api/logic/transfer', businessLogicController.transferPoints.bind(businessLogicController));
app.post('/api/logic/upgrade', businessLogicController.upgradeSubscription.bind(businessLogicController));
app.post('/api/logic/referral', businessLogicController.claimReferralReward.bind(businessLogicController));
app.post('/api/logic/cancel', businessLogicController.cancelOrder.bind(businessLogicController));

// Root endpoint with vulnerability summary
app.get('/', (req, res) => {
  res.json({
    message: 'Vulnerable Application for Security Testing',
    categories: {
      payment: 'Amount manipulation, gateway vulnerabilities',
      authentication: 'JWT bypass, session fixation, weak validation',
      xss: 'HTML injection, React vulnerabilities, event handlers',
      session: 'Cookie flags, CORS issues, ID exposure',
      cart: 'Price manipulation, discount abuse, calculation flaws',
      mongodb: '$ne, $where, $regex, $exists, aggregation injection',
      businessLogic: 'Payment/inventory race conditions, tenant isolation, double-spending'
    },
    warning: 'This application contains intentional security vulnerabilities for testing purposes only!'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message
  });
});

module.exports = app;