import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="footer-custom">
      <div class="container">
        <div class="footer-grid">
          <section class="brand-column">
            <a class="brand-lockup" routerLink="/home">
              <span class="brand-mark"><i class="bi bi-fire"></i></span>
              <span>FoodOrder</span>
            </a>
            <p class="brand-description">Good food, made easy. Find your next favorite and enjoy it at home.</p>
            <span class="copyright">&copy; {{ currentYear }} FoodOrder</span>
          </section>
          <section class="footer-column">
            <h6>Explore</h6>
            <ul>
              <li><a routerLink="/home">Home</a></li>
              <li><a routerLink="/foods">Browse menu</a></li>
              <li><a routerLink="/cart">Your cart</a></li>
              <li><a routerLink="/orders">Order history</a></li>
            </ul>
          </section>
          <section class="footer-column">
            <h6>Help &amp; support</h6>
            <p>Questions about an order? We’re here to help.</p>
            <a class="support-link" href="mailto:support&#64;foodorder.com">
              <i class="bi bi-envelope"></i> support&#64;foodorder.com
            </a>
            <div class="footer-payment-note">
              <i class="bi bi-shield-check"></i> Secure checkout with COD or Razorpay
            </div>
          </section>
          <section class="footer-column cities-column">
            <h6>Popular cities</h6>
            <div class="city-links">
              <a routerLink="/foods" *ngFor="let city of cities">{{ city }}</a>
            </div>
            <a class="all-cities-link" routerLink="/home">Discover FoodOrder <i class="bi bi-arrow-right"></i></a>
          </section>
        </div>
        <div class="footer-bottom">
          <span>Made for good food moments.</span>
          <div class="footer-bottom-links">
            <a routerLink="/foods">Menu</a>
            <a routerLink="/orders">My orders</a>
            <a href="mailto:support&#64;foodorder.com">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer-custom {
      background: linear-gradient(180deg, var(--secondary-light), var(--secondary));
      border-top: 1px solid var(--border-color);
      margin-top: 56px;
      padding: 48px 0 0;
    }
    .footer-grid { display: grid; grid-template-columns: 1.25fr 0.8fr 1.2fr 1fr; gap: clamp(24px, 4vw, 64px); padding-bottom: 42px; }
    .brand-lockup { display: inline-flex; align-items: center; gap: 10px; color: var(--text-primary); font-size: 1.65rem; font-weight: 800; letter-spacing: -0.04em; }
    .brand-lockup:hover { color: var(--text-primary); }
    .brand-mark { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 13px; color: white; background: var(--gradient-primary); font-size: 1.4rem; }
    .brand-description { max-width: 260px; margin: 18px 0 20px; color: var(--text-muted); font-size: 0.95rem; }
    .copyright { color: var(--text-muted); font-size: 0.88rem; }
    .footer-column h6 { margin: 4px 0 18px; color: var(--text-primary); font-size: 1rem; font-weight: 750; }
    .footer-column ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
    .footer-custom a { color: var(--text-secondary); text-decoration: none; transition: var(--transition); }
    .footer-custom a:hover { color: var(--primary-light); }
    .footer-column p { color: var(--text-muted); font-size: 0.9rem; margin: 0 0 14px; }
    .support-link { display: inline-flex; align-items: center; gap: 9px; font-weight: 600; font-size: 0.92rem; }
    .support-link i, .footer-payment-note i { color: var(--primary); }
    .footer-payment-note { display: flex; align-items: flex-start; gap: 9px; margin-top: 22px; color: var(--text-muted); font-size: 0.84rem; }
    .city-links { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 18px; }
    .city-links a { font-size: 0.9rem; }
    .all-cities-link { display: inline-flex; align-items: center; gap: 8px; margin-top: 20px; color: var(--primary-light) !important; font-size: 0.9rem; font-weight: 700; }
    .footer-bottom { display: flex; justify-content: space-between; align-items: center; gap: 20px; min-height: 62px; border-top: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.85rem; }
    .footer-bottom-links { display: flex; gap: 24px; }
    .footer-bottom-links a { color: var(--text-muted); }
    @media (max-width: 767.98px) {
      .footer-custom { margin-top: 40px; padding-top: 36px; }
      .footer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 32px 24px; }
      .brand-column { grid-column: 1 / -1; }
      .footer-bottom { align-items: flex-start; flex-direction: column; justify-content: center; padding: 16px 0; }
      .footer-bottom-links { flex-wrap: wrap; gap: 18px; }
    }
    @media (max-width: 420px) { .footer-grid { grid-template-columns: 1fr; } .brand-column { grid-column: auto; } }
  `]
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
  readonly cities = ['Bangalore', 'Delhi', 'Mumbai', 'Hyderabad', 'Pune', 'Chennai'];
}
