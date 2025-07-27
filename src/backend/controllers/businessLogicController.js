const mongoose = require('mongoose');

class BusinessLogicController {
  // VULNERABLE: Payment race condition
  async processPaymentWithInventory(req, res) {
    const { orderId, paymentDetails, items } = req.body;
    
    // Bug: No atomic transaction
    // Check inventory
    const available = await this.checkInventory(items);
    
    // Race condition: inventory can change between check and update
    if (available) {
      // Process payment first
      const payment = await this.processPayment(paymentDetails);
      
      // Bug: If this fails, payment is already processed
      await this.updateInventory(items);
      
      res.json({
        success: true,
        payment: payment,
        warning: 'Non-atomic operation'
      });
    } else {
      res.status(400).json({ error: 'Insufficient inventory' });
    }
  }
  
  // VULNERABLE: Tenant isolation bypass
  async accessTenantData(req, res) {
    const { tenantId, adminOverride, targetTenant } = req.body;
    
    // Bug: Override allows cross-tenant access
    const effectiveTenant = adminOverride ? targetTenant : tenantId;
    
    // Bug: No validation of tenant ownership
    const data = await this.getTenantData(effectiveTenant);
    
    res.json({
      tenantData: data,
      accessedTenant: effectiveTenant,
      originalTenant: tenantId,
      crossTenantAccess: effectiveTenant !== tenantId
    });
  }
  
  // VULNERABLE: Inventory double-spending
  async reserveInventory(req, res) {
    const { productId, quantity, reservationId } = req.body;
    
    // Bug: No check for duplicate reservations
    const reservation = {
      id: reservationId || Date.now(),
      productId,
      quantity,
      timestamp: Date.now()
    };
    
    // Bug: Can reserve same inventory multiple times
    await this.createReservation(reservation);
    
    res.json({
      reserved: true,
      reservation: reservation,
      hint: 'Use same reservationId multiple times'
    });
  }
  
  // VULNERABLE: Payment webhook replay
  async handlePaymentWebhook(req, res) {
    const { webhookId, paymentId, amount, timestamp } = req.body;
    
    // Bug: No idempotency check
    // Same webhook can be processed multiple times
    const credit = {
      paymentId,
      amount,
      creditedAt: Date.now()
    };
    
    // Bug: Credits account every time
    await this.creditAccount(paymentId, amount);
    
    res.json({
      processed: true,
      credited: amount,
      warning: 'No replay protection'
    });
  }
  
  // VULNERABLE: Discount calculation ordering
  async calculateFinalPrice(req, res) {
    const { basePrice, discounts, tax, orderMatters } = req.body;
    
    let finalPrice = basePrice;
    
    // Bug: Order of operations affects final price
    if (orderMatters) {
      // Apply percentage discounts first (wrong order)
      discounts.filter(d => d.type === 'percentage').forEach(d => {
        finalPrice = finalPrice * (1 - d.value / 100);
      });
      
      // Then fixed discounts
      discounts.filter(d => d.type === 'fixed').forEach(d => {
        finalPrice = finalPrice - d.value;
      });
      
      // Tax on discounted price (should be on base price)
      finalPrice = finalPrice * (1 + tax);
    } else {
      // Different calculation order gives different result
      finalPrice = (basePrice - discounts.filter(d => d.type === 'fixed')
        .reduce((sum, d) => sum + d.value, 0)) * (1 + tax);
    }
    
    res.json({
      basePrice,
      finalPrice,
      discounts: discounts.length,
      calculationOrder: orderMatters ? 'exploitable' : 'normal'
    });
  }
  
  // VULNERABLE: Concurrent booking without locks
  async bookResource(req, res) {
    const { resourceId, userId, startTime, duration } = req.body;
    
    // Bug: Check availability without lock
    const isAvailable = await this.checkAvailability(resourceId, startTime, duration);
    
    // Race condition: Another booking can happen here
    
    if (isAvailable) {
      // Bug: No atomic operation
      const booking = await this.createBooking({
        resourceId,
        userId,
        startTime,
        duration
      });
      
      res.json({
        booked: true,
        booking,
        warning: 'Race condition possible'
      });
    } else {
      res.status(409).json({ error: 'Resource not available' });
    }
  }
  
  // VULNERABLE: Points/credits system manipulation
  async transferPoints(req, res) {
    const { fromUser, toUser, amount, bypassValidation } = req.body;
    
    // Bug: No transaction atomicity
    const sourceBalance = await this.getBalance(fromUser);
    
    // Bug: Bypass allows negative balance
    if (bypassValidation || sourceBalance >= amount) {
      // Deduct from source
      await this.updateBalance(fromUser, -amount);
      
      // Bug: If this fails, points are lost
      await this.updateBalance(toUser, amount);
      
      res.json({
        transferred: true,
        amount,
        warning: 'Non-atomic transfer'
      });
    } else {
      res.status(400).json({ error: 'Insufficient balance' });
    }
  }
  
  // VULNERABLE: Subscription overlap
  async upgradeSubscription(req, res) {
    const { userId, newPlan, immediateUpgrade, keepOldBenefits } = req.body;
    
    // Bug: Can have multiple active subscriptions
    if (!immediateUpgrade) {
      await this.cancelSubscription(userId);
    }
    
    const newSubscription = await this.createSubscription(userId, newPlan);
    
    // Bug: Old subscription benefits might still be active
    if (keepOldBenefits) {
      // User has benefits from both plans
      res.json({
        upgraded: true,
        subscription: newSubscription,
        exploit: 'Multiple active subscriptions'
      });
    } else {
      res.json({
        upgraded: true,
        subscription: newSubscription
      });
    }
  }
  
  // VULNERABLE: Referral reward exploitation
  async claimReferralReward(req, res) {
    const { referrerId, referredId, rewardType, customReward } = req.body;
    
    // Bug: No check for self-referral
    // Bug: No check for already claimed
    // Bug: No validation of relationship
    
    const reward = customReward || this.getDefaultReward(rewardType);
    
    // Credit referrer
    await this.creditReward(referrerId, reward);
    
    // Bug: Can claim multiple times
    res.json({
      claimed: true,
      reward,
      referrer: referrerId,
      referred: referredId,
      exploits: ['self-referral', 'multiple-claims', 'fake-referrals']
    });
  }
  
  // VULNERABLE: Order cancellation race condition
  async cancelOrder(req, res) {
    const { orderId, refundAmount, skipStatusCheck } = req.body;
    
    // Bug: Status check can be bypassed
    if (!skipStatusCheck) {
      const status = await this.getOrderStatus(orderId);
      if (status === 'shipped') {
        return res.status(400).json({ error: 'Cannot cancel shipped order' });
      }
    }
    
    // Bug: Refund processed before actual cancellation
    await this.processRefund(orderId, refundAmount);
    
    // Race condition: Order might ship here
    
    // Cancel order
    await this.updateOrderStatus(orderId, 'cancelled');
    
    res.json({
      cancelled: true,
      refunded: refundAmount,
      warning: 'Refund before cancellation'
    });
  }
  
  // Helper methods (simulated)
  async checkInventory(items) {
    return true;
  }
  
  async processPayment(details) {
    return { id: 'payment_' + Date.now(), ...details };
  }
  
  async updateInventory(items) {
    return true;
  }
  
  async getTenantData(tenantId) {
    return { tenantId, data: 'sensitive_data_' + tenantId };
  }
  
  async createReservation(reservation) {
    return reservation;
  }
  
  async creditAccount(paymentId, amount) {
    return { credited: amount };
  }
  
  async checkAvailability(resourceId, startTime, duration) {
    return Math.random() > 0.3; // Simulated availability
  }
  
  async createBooking(booking) {
    return { id: 'booking_' + Date.now(), ...booking };
  }
  
  async getBalance(userId) {
    return 1000; // Simulated balance
  }
  
  async updateBalance(userId, delta) {
    return true;
  }
  
  async cancelSubscription(userId) {
    return true;
  }
  
  async createSubscription(userId, plan) {
    return { id: 'sub_' + Date.now(), userId, plan };
  }
  
  getDefaultReward(type) {
    return type === 'premium' ? 100 : 50;
  }
  
  async creditReward(userId, amount) {
    return true;
  }
  
  async getOrderStatus(orderId) {
    return 'pending';
  }
  
  async processRefund(orderId, amount) {
    return { refundId: 'refund_' + Date.now() };
  }
  
  async updateOrderStatus(orderId, status) {
    return true;
  }
}

module.exports = new BusinessLogicController();