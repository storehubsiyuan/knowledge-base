const crypto = require('crypto');
const Employee = require('../../../models/Employee');

class PaymentController {
  // VULNERABLE: Amount manipulation - client controls final amount
  async processPayment(req, res) {
    const { amount, currency, customerId, items } = req.body;
    
    // Bug: Trusting client-provided amount without server-side validation
    const paymentData = {
      amount: amount, // Should calculate from items server-side
      currency: currency || 'USD',
      customerId,
      items,
      timestamp: Date.now()
    };
    
    // Process payment with client-provided amount
    const result = await this.chargePayment(paymentData);
    res.json({ success: true, payment: result });
  }
  
  // VULNERABLE: Direct gateway parameter manipulation
  async processStripePayment(req, res) {
    // Bug: Passing raw request body to payment gateway
    const stripePayload = {
      ...req.body, // Allows injection of gateway-specific parameters
      api_key: process.env.STRIPE_KEY
    };
    
    // Client can inject: capture: false, metadata, etc.
    const payment = await this.stripeGateway.charge(stripePayload);
    res.json(payment);
  }
  
  // VULNERABLE: Refund amount manipulation
  async processRefund(req, res) {
    const { orderId, refundAmount, reason } = req.body;
    
    // Bug: No validation that refundAmount <= originalAmount
    const refund = {
      orderId,
      amount: refundAmount, // Client controls refund amount
      reason,
      processedBy: req.user.id
    };
    
    await this.executeRefund(refund);
    res.json({ refunded: refundAmount });
  }
  
  // VULNERABLE: Payment splitting manipulation
  async splitPayment(req, res) {
    const { totalAmount, splits } = req.body;
    
    // Bug: No validation that sum of splits equals totalAmount
    const payments = splits.map(split => ({
      recipientId: split.recipientId,
      amount: split.amount, // Client controls each split amount
      percentage: split.percentage
    }));
    
    await this.processSplitPayments(payments);
    res.json({ splits: payments });
  }
  
  // VULNERABLE: Currency conversion manipulation
  async convertCurrency(req, res) {
    const { amount, fromCurrency, toCurrency, customRate } = req.body;
    
    // Bug: Allowing client to provide exchange rate
    const rate = customRate || await this.getExchangeRate(fromCurrency, toCurrency);
    const converted = amount * rate; // Client can manipulate rate
    
    res.json({ 
      original: amount,
      converted: converted,
      rate: rate
    });
  }
  
  // VULNERABLE: Discount calculation bypass
  async applyDiscount(req, res) {
    const { orderId, discountCode, discountAmount, overrideValidation } = req.body;
    
    // Bug: Override flag allows bypassing validation
    if (overrideValidation || await this.validateDiscount(discountCode)) {
      // Client can set their own discount amount
      const finalAmount = req.body.originalAmount - discountAmount;
      
      res.json({
        discountApplied: discountAmount,
        finalAmount: finalAmount
      });
    }
  }
  
  // VULNERABLE: Payment method validation bypass
  async addPaymentMethod(req, res) {
    const { cardNumber, cvv, expiryDate, saveCard, skipValidation } = req.body;
    
    // Bug: Skip validation flag
    if (!skipValidation) {
      // Weak validation - only checks length
      if (cardNumber.length < 13) {
        return res.status(400).json({ error: 'Invalid card' });
      }
    }
    
    // Store card without proper encryption
    const paymentMethod = {
      cardNumber: cardNumber, // Should be tokenized
      cvv: cvv, // Should never be stored
      expiryDate: expiryDate,
      userId: req.user.id
    };
    
    await this.savePaymentMethod(paymentMethod);
    res.json({ saved: true });
  }
  
  // VULNERABLE: Fee calculation manipulation
  async calculateFees(req, res) {
    const { amount, feePercentage, flatFee, excludeFees } = req.body;
    
    // Bug: Client controls fee calculation
    let totalFees = 0;
    if (!excludeFees) {
      totalFees = (amount * (feePercentage || 0.029)) + (flatFee || 0.30);
    }
    
    res.json({
      subtotal: amount,
      fees: totalFees,
      total: amount + totalFees
    });
  }
  
  // Helper methods (simulated)
  async chargePayment(data) {
    return { id: crypto.randomBytes(16).toString('hex'), ...data };
  }
  
  async executeRefund(data) {
    return { refundId: crypto.randomBytes(16).toString('hex'), ...data };
  }
  
  async processSplitPayments(splits) {
    return splits.map(s => ({ ...s, status: 'completed' }));
  }
  
  async getExchangeRate(from, to) {
    return 1.5; // Mock rate
  }
  
  async validateDiscount(code) {
    return code === 'VALID20';
  }
  
  async savePaymentMethod(data) {
    // Simulated save
    return true;
  }
  
  stripeGateway = {
    charge: async (data) => ({ id: 'ch_' + crypto.randomBytes(8).toString('hex'), ...data })
  };
}

module.exports = new PaymentController();