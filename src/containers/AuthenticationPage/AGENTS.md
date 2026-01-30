# AuthenticationPage Customization

AuthenticationPage handles all authentication logic. To customize the appearance, style it with CSS only.

## Example: Split Layout with Branding

Style the existing AuthenticationPage to create a split-screen layout:

```css
/* Override ResponsiveBackgroundImageContainer to create split layout */
.root {
  display: flex !important;
  height: 100vh;
}

/* Left side - branding */
.root::before {
  content: '';
  flex: 0 0 50%;
  background: linear-gradient(135deg, var(--marketplaceColor) 0%, rgba(0,0,0,0.1) 100%);
  order: -1;
}

/* Right side - form */
.contentContainer {
  flex: 1;
  background: white;
}

.layoutWrapperMain {
  justify-content: center;
  align-items: center;
}
```

## Key Principle

Only modify CSS. Never reimplement:
- Authentication logic
- Form handling
- Redux state
- Error handling
- Social login

This way, Sharetribe updates automatically apply to your version.
