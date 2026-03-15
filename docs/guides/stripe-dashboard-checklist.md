# Stripe Dashboard Pre-Production Checklist

> Everything to configure in the Stripe Dashboard before going live with payments.

## Checklist

### 1. Products & Prices

- [ ] Create your product(s) in **Products** → **Add product**
- [ ] Set up pricing for each product — choose between recurring (subscription) or one-time
- [ ] For subscriptions: configure billing period (monthly, yearly, or both)
- [ ] Copy each Price ID (`price_xxx`) into your app's environment/config
- [ ] Verify prices match what's displayed on your pricing page

### 2. Tax

- [ ] Go to **Settings** → **Tax** and enable Stripe Tax
- [ ] Set your business tax registration(s) (country, VAT/GST number)
- [ ] Choose tax behavior on prices: **inclusive** or **exclusive**
- [ ] Enable automatic tax collection on Checkout Sessions
- [ ] Verify tax is calculated correctly by running a test checkout

### 3. Customer Portal

- [ ] Go to **Settings** → **Billing** → **Customer portal**
- [ ] Enable the features customers can manage:
  - [ ] Update payment method
  - [ ] View invoice history
  - [ ] Cancel subscription
  - [ ] Switch plans (if applicable)
- [ ] Customize branding (logo, colors, links)
- [ ] Set cancellation policy (immediate vs. end of period)
- [ ] Test the portal flow end-to-end in test mode

## Rules

- Complete all steps in **test mode** first, then repeat in **live mode**
- Double-check that Price IDs in your app config match the live mode prices (test and live IDs are different)
- Always test a full checkout → portal → cancellation flow before launch
