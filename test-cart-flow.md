# Cart Flow Test Guide

## Changes Implemented

### Problem
The cart was being cleared immediately when an order was created, even if the payment was not completed. This meant users lost their cart items if they cancelled payment or if payment failed.

### Solution
Modified the payment flow to only clear the cart after successful payment completion:

1. **Removed cart deletion from OrderService.java** (line 259)
   - Cart is no longer deleted when order is created

2. **Added cart deletion to PaymentService.java** in two places:
   - In `handleWebhook()` method when payment status is PAID (lines 180-184)
   - In `confirmTossPayment()` method after successful payment confirmation (lines 449-452)

## Testing Steps

### 1. Add items to cart
1. Login to the application
2. Add several products to your cart
3. Go to cart page (/cart) and verify items are present

### 2. Start checkout but don't complete payment
1. Click "주문하기" (Order) button
2. Fill in shipping information
3. Proceed to payment page
4. **DON'T complete the payment** - either:
   - Close the payment window
   - Click cancel/back button
   - Let it timeout

### 3. Verify cart is preserved
1. Go back to cart page (/cart)
2. **Expected result**: All items should still be in the cart
3. The cart should NOT be empty

### 4. Complete a successful payment
1. Start checkout again with the same cart items
2. Complete the payment successfully
3. After payment confirmation, go to cart page
4. **Expected result**: Cart should now be empty

### 5. Test with payment failure
1. Add new items to cart
2. Start checkout
3. Use test card that will fail (if in test mode)
4. After payment fails, check cart
5. **Expected result**: Cart items should still be present

## Technical Details

### Modified Files
- `/backend/src/main/java/com/agri/market/order/OrderService.java`
  - Commented out: `cartRepository.findByUser(user).ifPresent(cartRepository::delete);`

- `/backend/src/main/java/com/agri/market/payment/PaymentService.java`
  - Added CartRepository dependency
  - Added cart deletion in webhook handler when status is PAID
  - Added cart deletion in confirmTossPayment after successful confirmation

### Cart Deletion Triggers
Cart is now only deleted when:
1. Payment webhook confirms PAID status
2. Payment confirmation API returns success

### Logging
Added logging statements to track cart clearing:
- "Cart cleared for user {email} after successful payment"
- "Cart cleared for user {email} after payment confirmation"

## Test Payment Information

For testing in Toss Payments test environment:
- Test card number: 4330 0000 0000 0005
- Any future expiry date
- Any CVC
- Any cardholder name

## Verification Commands

Check backend logs for cart operations:
```bash
# Check for cart clearing logs
grep "Cart cleared" backend/logs/application.log

# Check for order creation without cart deletion
grep "Order created" backend/logs/application.log
```