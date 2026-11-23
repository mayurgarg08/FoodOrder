import { Component, OnInit } from '@angular/core';
import { FoodService } from '../../../core/services/food.service';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../shared/models/order.model';
import { forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="container animate-fade-in">
      <header class="dashboard-header">
        <div>
          <span class="dashboard-kicker">FOODORDER / OVERVIEW</span>
          <h1><i class="bi bi-speedometer2 me-2"></i>Admin Dashboard</h1>
          <p class="text-muted mb-0">A clear view of orders, sales and your menu performance.</p>
        </div>
        <a routerLink="/admin/orders" class="btn btn-primary-custom"><i class="bi bi-list-check me-2"></i>Manage orders</a>
      </header>

      <section class="report-toolbar mb-4" aria-label="Download sales reports">
        <div class="report-intro">
          <span class="report-icon"><i class="bi bi-file-earmark-bar-graph"></i></span>
          <span><strong>Sales reports</strong><small>Export order details and revenue summaries</small></span>
        </div>
        <label class="report-field">Report period
          <select [(ngModel)]="reportPeriod" aria-label="Report period">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <label class="report-field">Reference date
          <input type="date" [(ngModel)]="reportDate" [max]="today" aria-label="Report reference date">
        </label>
        <div class="report-buttons">
          <button type="button" class="btn btn-outline-custom" (click)="downloadSalesReport('pdf')" [disabled]="downloadingReport !== null">
            <i class="bi bi-file-earmark-pdf me-2"></i>{{ downloadingReport === 'pdf' ? 'Preparing…' : 'PDF' }}
          </button>
          <button type="button" class="btn btn-primary-custom" (click)="downloadSalesReport('excel')" [disabled]="downloadingReport !== null">
            <i class="bi bi-file-earmark-spreadsheet me-2"></i>{{ downloadingReport === 'excel' ? 'Preparing…' : 'Excel' }}
          </button>
        </div>
      </section>

      <section class="kpi-grid mb-4" aria-label="Business key performance indicators">
        <article class="kpi-card accent-orange">
          <div class="kpi-top"><span>Total revenue</span><i class="bi bi-currency-rupee"></i></div>
          <strong>{{ stats.totalRevenue | currency:'INR':'symbol':'1.0-0':'en-IN' }}</strong>
          <small><i class="bi bi-graph-up-arrow me-1"></i>Across {{ stats.totalOrders }} orders</small>
        </article>
        <article class="kpi-card accent-blue">
          <div class="kpi-top"><span>Total orders</span><i class="bi bi-bag-check"></i></div>
          <strong>{{ stats.totalOrders }}</strong>
          <small>{{ stats.pendingOrders }} awaiting preparation</small>
        </article>
        <article class="kpi-card accent-green">
          <div class="kpi-top"><span>Average order</span><i class="bi bi-receipt"></i></div>
          <strong>{{ stats.averageOrder | currency:'INR':'symbol':'1.0-0':'en-IN' }}</strong>
          <small>{{ stats.deliveredOrders }} orders delivered</small>
        </article>
        <article class="kpi-card accent-purple">
          <div class="kpi-top"><span>Menu items</span><i class="bi bi-egg-fried"></i></div>
          <strong>{{ stats.totalFoods }}</strong>
          <small>Items available in your menu</small>
        </article>
      </section>

      <section class="row g-4 mb-4" aria-label="Order analytics">
        <div class="col-lg-5">
          <article class="dashboard-panel h-100">
            <div class="panel-heading">
              <div><span class="panel-eyebrow">ORDER MIX</span><h2>Order status</h2></div>
              <span class="panel-icon"><i class="bi bi-pie-chart"></i></span>
            </div>
            <div class="status-chart-layout" *ngIf="stats.totalOrders > 0; else noStatusData">
              <div class="donut-chart" [style.background]="statusChartBackground">
                <div class="donut-hole"><strong>{{ stats.totalOrders }}</strong><span>orders</span></div>
              </div>
              <div class="status-legend">
                <div class="legend-item" *ngFor="let item of statusBreakdown">
                  <span class="legend-label"><i [style.backgroundColor]="item.color"></i>{{ item.label }}</span>
                  <strong>{{ item.count }}</strong>
                </div>
              </div>
            </div>
            <ng-template #noStatusData><div class="chart-empty"><i class="bi bi-pie-chart"></i><span>Order status data will appear here.</span></div></ng-template>
          </article>
        </div>
        <div class="col-lg-7">
          <article class="dashboard-panel h-100">
            <div class="panel-heading">
              <div><span class="panel-eyebrow">LAST 7 DAYS</span><h2>Order activity</h2></div>
              <span class="activity-total"><i class="bi bi-bag me-1"></i>{{ stats.totalOrders }} total</span>
            </div>
            <div class="activity-chart" *ngIf="stats.totalOrders > 0; else noActivityData">
              <div class="activity-column" *ngFor="let day of weeklyOrders">
                <span class="activity-count">{{ day.count }}</span>
                <div class="bar-track"><div class="activity-bar" [style.height.%]="day.height"></div></div>
                <span class="activity-day">{{ day.label }}</span>
              </div>
            </div>
            <ng-template #noActivityData><div class="chart-empty"><i class="bi bi-bar-chart"></i><span>New orders will appear here.</span></div></ng-template>
          </article>
        </div>
      </section>

      <section class="row g-4 mb-5">
        <div class="col-lg-7">
          <article class="dashboard-panel h-100">
            <div class="panel-heading">
              <div><span class="panel-eyebrow">LATEST ACTIVITY</span><h2>Recent orders</h2></div>
              <a routerLink="/admin/orders" class="panel-link">View all <i class="bi bi-arrow-right ms-1"></i></a>
            </div>
            <div class="table-responsive" *ngIf="recentOrders.length; else noRecentOrders">
              <table class="table dashboard-table align-middle mb-0">
                <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  <tr *ngFor="let order of recentOrders">
                    <td><strong>#{{ order.id }}</strong><small>{{ order.orderDate | date:'MMM d, h:mm a' }}</small></td>
                    <td>{{ order.userName || 'Customer' }}</td>
                    <td class="amount-cell">{{ order.totalAmount | currency:'INR':'symbol':'1.0-0':'en-IN' }}</td>
                    <td><span class="order-status" [ngClass]="statusClass(order.status)">{{ statusLabel(order.status) }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ng-template #noRecentOrders><div class="chart-empty compact"><i class="bi bi-inbox"></i><span>No orders yet. New orders will show here.</span></div></ng-template>
          </article>
        </div>
        <div class="col-lg-5">
          <article class="dashboard-panel quick-panel h-100">
            <div class="panel-heading">
              <div><span class="panel-eyebrow">SHORTCUTS</span><h2>Quick actions</h2></div>
              <span class="panel-icon"><i class="bi bi-lightning-charge"></i></span>
            </div>
            <a routerLink="/admin/foods" class="action-link"><span class="action-icon orange"><i class="bi bi-plus-lg"></i></span><span><strong>Manage food items</strong><small>Add, edit or update availability</small></span><i class="bi bi-arrow-up-right"></i></a>
            <a routerLink="/admin/categories" class="action-link"><span class="action-icon blue"><i class="bi bi-tags"></i></span><span><strong>Manage categories</strong><small>Organize your menu</small></span><i class="bi bi-arrow-up-right"></i></a>
            <a routerLink="/admin/orders" class="action-link"><span class="action-icon green"><i class="bi bi-card-checklist"></i></span><span><strong>Manage orders</strong><small>Review and update order status</small></span><i class="bi bi-arrow-up-right"></i></a>
          </article>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 24px 0 30px; }
    .dashboard-kicker, .panel-eyebrow { color: var(--primary); font-size: .72rem; font-weight: 800; letter-spacing: .14em; }
    .dashboard-header h1 { margin: 7px 0 5px; font-size: clamp(1.8rem, 3vw, 2.5rem); font-weight: 850; letter-spacing: -.04em; }
    .report-toolbar { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border: 1px solid var(--border-color); border-radius: 18px; background: linear-gradient(110deg, rgba(217,56,30,.09), rgba(255,255,255,.018) 46%); }
    .report-intro { display: flex; flex: 1; min-width: 200px; align-items: center; gap: 11px; }.report-intro > span:last-child { display: flex; flex-direction: column; gap: 3px; }.report-intro strong { font-size: .9rem; }.report-intro small { color: var(--text-muted); font-size: .75rem; }
    .report-icon { display: grid; flex: 0 0 40px; width: 40px; height: 40px; place-items: center; border-radius: 12px; color: var(--primary); background: rgba(217,56,30,.13); font-size: 1.15rem; }
    .report-field { display: flex; flex-direction: column; gap: 5px; color: var(--text-muted); font-size: .7rem; font-weight: 700; }
    .report-field select, .report-field input { min-width: 128px; height: 38px; padding: 0 10px; border: 1px solid var(--border-color); border-radius: 9px; background: var(--bg-card); color: var(--text-primary); font: inherit; font-size: .82rem; }
    .report-field input { min-width: 145px; color-scheme: dark; }
    .report-buttons { display: flex; align-items: end; gap: 8px; }.report-buttons .btn { height: 38px; padding: 7px 12px; font-size: .82rem; white-space: nowrap; }.report-buttons .btn:disabled { opacity: .65; cursor: wait; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
    .kpi-card, .dashboard-panel { border: 1px solid var(--border-color); border-radius: 20px; background: linear-gradient(145deg, rgba(255,255,255,.045), rgba(255,255,255,.015)); box-shadow: 0 14px 34px rgba(0,0,0,.14); }
    .kpi-card { position: relative; overflow: hidden; padding: 21px 22px; }
    .kpi-card::after { position: absolute; content: ''; width: 100px; height: 100px; right: -35px; bottom: -55px; border-radius: 50%; background: currentColor; opacity: .05; }
    .kpi-top { display: flex; align-items: center; justify-content: space-between; color: var(--text-muted); font-size: .88rem; font-weight: 600; }
    .kpi-top i { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; background: currentColor; font-size: 1.05rem; }
    .kpi-top i::before { filter: brightness(1.5); }
    .kpi-card > strong { display: block; margin: 12px 0 4px; color: var(--text-primary); font-size: clamp(1.45rem, 2.4vw, 2rem); line-height: 1.15; font-weight: 800; letter-spacing: -.04em; }
    .kpi-card > small { color: var(--text-muted); font-size: .8rem; }
    .accent-orange { color: #ff7048; }.accent-blue { color: #54a9ff; }.accent-green { color: #34d399; }.accent-purple { color: #b194ff; }
    .dashboard-panel { height: 100%; padding: 23px; }
    .panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 15px; margin-bottom: 22px; }
    .panel-heading h2 { margin: 4px 0 0; font-size: 1.15rem; font-weight: 750; }
    .panel-icon { display: grid; place-items: center; width: 40px; height: 40px; border: 1px solid var(--border-color); border-radius: 13px; color: var(--primary); background: rgba(217,56,30,.08); }
    .status-chart-layout { display: flex; align-items: center; justify-content: space-around; gap: 24px; min-height: 220px; }
    .donut-chart { display: grid; flex: 0 0 176px; width: 176px; height: 176px; place-items: center; border-radius: 50%; }
    .donut-hole { display: flex; width: 126px; height: 126px; flex-direction: column; align-items: center; justify-content: center; border-radius: 50%; background: var(--bg-card); }
    .donut-hole strong { font-size: 1.8rem; line-height: 1.1; }.donut-hole span { color: var(--text-muted); font-size: .8rem; }
    .status-legend { display: grid; flex: 1; gap: 12px; }
    .legend-item, .legend-label { display: flex; align-items: center; }.legend-item { justify-content: space-between; gap: 10px; font-size: .85rem; }
    .legend-label { gap: 9px; color: var(--text-secondary); }.legend-label i { width: 9px; height: 9px; border-radius: 50%; }
    .activity-total { padding: 7px 10px; border: 1px solid var(--border-color); border-radius: 20px; color: var(--text-secondary); font-size: .78rem; }
    .activity-chart { display: grid; grid-template-columns: repeat(7, 1fr); align-items: end; gap: 12px; height: 220px; padding-top: 8px; }
    .activity-column { display: flex; height: 100%; flex-direction: column; align-items: center; justify-content: flex-end; gap: 8px; }
    .activity-count { color: var(--text-secondary); font-size: .75rem; font-weight: 700; }
    .bar-track { display: flex; width: min(34px, 100%); height: 160px; align-items: flex-end; overflow: hidden; border-radius: 9px; background: rgba(255,255,255,.045); }
    .activity-bar { width: 100%; min-height: 5px; border-radius: 9px; background: linear-gradient(180deg, #ff805b, var(--primary)); box-shadow: 0 4px 16px rgba(217,56,30,.25); transition: height .35s ease; }
    .activity-day { color: var(--text-muted); font-size: .75rem; }
    .chart-empty { display: flex; min-height: 220px; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: var(--text-muted); text-align: center; }
    .chart-empty i { color: var(--primary); font-size: 1.8rem; }.chart-empty.compact { min-height: 140px; }
    .panel-link { color: var(--primary); font-size: .85rem; font-weight: 700; text-decoration: none; }.panel-link:hover { color: #ff805b; }
    .dashboard-table { --bs-table-bg: transparent; --bs-table-color: var(--text-primary); --bs-table-border-color: var(--border-color); }
    .dashboard-table th { padding: 0 12px 12px; color: var(--text-muted); font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
    .dashboard-table td { padding: 14px 12px; font-size: .85rem; white-space: nowrap; }
    .dashboard-table td:first-child strong, .dashboard-table td:first-child small { display: block; }.dashboard-table td:first-child small { margin-top: 3px; color: var(--text-muted); font-size: .73rem; }
    .amount-cell { font-weight: 700; }.order-status { display: inline-block; padding: 5px 9px; border: 1px solid currentColor; border-radius: 20px; font-size: .68rem; font-weight: 750; }
    .status-pending { color: #f7b955; background: rgba(247,185,85,.08); }.status-confirmed { color: #58b5ff; background: rgba(88,181,255,.08); }.status-preparing { color: #b194ff; background: rgba(177,148,255,.08); }.status-outfordelivery { color: #ff956b; background: rgba(255,149,107,.08); }.status-delivered { color: #34d399; background: rgba(52,211,153,.08); }.status-cancelled { color: #fb7185; background: rgba(251,113,133,.08); }
    .action-link { display: flex; align-items: center; gap: 13px; padding: 15px 0; border-bottom: 1px solid var(--border-color); color: var(--text-primary); text-decoration: none; transition: transform .2s ease, color .2s ease; }
    .action-link:last-child { padding-bottom: 0; border-bottom: 0; }.action-link:hover { color: var(--primary); transform: translateX(3px); }
    .action-icon { display: grid; flex: 0 0 42px; width: 42px; height: 42px; place-items: center; border-radius: 13px; }.action-icon.orange { color: #ff7048; background: rgba(255,112,72,.12); }.action-icon.blue { color: #54a9ff; background: rgba(84,169,255,.12); }.action-icon.green { color: #34d399; background: rgba(52,211,153,.12); }
    .action-link > span:nth-child(2) { display: flex; flex: 1; flex-direction: column; gap: 3px; }.action-link strong { font-size: .88rem; }.action-link small { color: var(--text-muted); font-size: .75rem; }.action-link > i:last-child { color: var(--text-muted); font-size: .85rem; }
    @media (max-width: 991.98px) { .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.report-toolbar { flex-wrap: wrap; }.report-intro { flex-basis: 100%; } }
    @media (max-width: 575.98px) { .dashboard-header { align-items: flex-start; flex-direction: column; }.report-toolbar { align-items: stretch; }.report-field { flex: 1; }.report-field select, .report-field input { width: 100%; min-width: 0; }.report-buttons { width: 100%; }.report-buttons .btn { flex: 1; }.kpi-grid { gap: 10px; }.kpi-card { padding: 16px; }.kpi-top { font-size: .78rem; }.kpi-top i { width: 32px; height: 32px; }.kpi-card > strong { font-size: 1.4rem; }.dashboard-panel { padding: 18px; }.status-chart-layout { flex-direction: column; padding: 5px 0; }.status-legend { width: 100%; }.activity-chart { gap: 6px; }.dashboard-table td { padding: 12px 8px; } }
  `]
})
export class AdminDashboardComponent implements OnInit {
  reportPeriod: 'daily' | 'weekly' | 'monthly' = 'daily';
  reportDate = '';
  today = '';
  downloadingReport: 'pdf' | 'excel' | null = null;
  stats = { totalOrders: 0, pendingOrders: 0, deliveredOrders: 0, totalRevenue: 0, averageOrder: 0, totalFoods: 0 };
  recentOrders: Order[] = [];
  statusBreakdown: { label: string; key: string; count: number; color: string }[] = [];
  weeklyOrders: { label: string; count: number; height: number }[] = [];
  statusChartBackground = 'conic-gradient(#343434 0deg 360deg)';
  private readonly statusColors: Record<string, string> = {
    pending: '#f7b955', confirmed: '#58b5ff', preparing: '#b194ff',
    outfordelivery: '#ff956b', delivered: '#34d399', cancelled: '#fb7185'
  };

  constructor(private foodService: FoodService, private orderService: OrderService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.today = this.localDateString(new Date());
    this.reportDate = this.today;
    forkJoin({
      orders: this.orderService.getAllOrders(),
      foods: this.foodService.getAll()
    }).subscribe(({ orders, foods }) => {
      this.stats.totalOrders = orders.length;
      this.stats.pendingOrders = orders.filter(o => this.normalizeStatus(o.status) === 'pending').length;
      this.stats.deliveredOrders = orders.filter(o => this.normalizeStatus(o.status) === 'delivered').length;
      this.stats.totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
      this.stats.averageOrder = orders.length ? this.stats.totalRevenue / orders.length : 0;
      this.stats.totalFoods = foods.length;
      this.recentOrders = [...orders].sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()).slice(0, 5);
      this.buildStatusChart(orders);
      this.buildWeeklyChart(orders);
    });
  }

  downloadSalesReport(format: 'pdf' | 'excel'): void {
    if (!this.reportDate) {
      this.toastr.error('Choose a reference date for the sales report.');
      return;
    }

    this.downloadingReport = format;
    this.orderService.downloadSalesReport(this.reportPeriod, this.reportDate, format).subscribe({
      next: file => {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = `foodorder-sales-${this.reportPeriod}-${this.reportDate}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        link.click();
        URL.revokeObjectURL(url);
        this.downloadingReport = null;
        this.toastr.success(`${this.reportPeriod[0].toUpperCase()}${this.reportPeriod.slice(1)} sales report downloaded.`);
      },
      error: () => {
        this.downloadingReport = null;
        this.toastr.error('Could not generate the sales report. Please try again.');
      }
    });
  }

  private localDateString(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  statusLabel(status: string): string {
    const normalized = this.normalizeStatus(status);
    const labels: Record<string, string> = { outfordelivery: 'Out for delivery' };
    return labels[normalized] || normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  statusClass(status: string): string {
    return `status-${this.normalizeStatus(status)}`;
  }

  private normalizeStatus(status: string): string {
    return (status || 'pending').replace(/[\s_-]/g, '').toLowerCase();
  }

  private buildStatusChart(orders: Order[]): void {
    const statuses = [
      { key: 'pending', label: 'Pending' }, { key: 'confirmed', label: 'Confirmed' },
      { key: 'preparing', label: 'Preparing' }, { key: 'outfordelivery', label: 'Out for delivery' },
      { key: 'delivered', label: 'Delivered' }, { key: 'cancelled', label: 'Cancelled' }
    ];
    this.statusBreakdown = statuses.map(status => ({
      ...status,
      count: orders.filter(order => this.normalizeStatus(order.status) === status.key).length,
      color: this.statusColors[status.key]
    }));

    if (!orders.length) {
      this.statusChartBackground = 'conic-gradient(#343434 0deg 360deg)';
      return;
    }

    let angle = 0;
    const stops = this.statusBreakdown.map(status => {
      const start = angle;
      angle += status.count / orders.length * 360;
      return `${status.color} ${start}deg ${angle}deg`;
    });
    this.statusChartBackground = `conic-gradient(${stops.join(', ')})`;
  }

  private buildWeeklyChart(orders: Order[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const count = orders.filter(order => {
        const orderDate = new Date(order.orderDate);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === date.getTime();
      }).length;
      return { label: date.toLocaleDateString('en-IN', { weekday: 'short' }), count, height: 0 };
    });
    const maxCount = Math.max(...days.map(day => day.count), 1);
    this.weeklyOrders = days.map(day => ({ ...day, height: day.count ? Math.max(9, day.count / maxCount * 100) : 4 }));
  }
}
